const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const ApprovalFlow = require('../models/ApprovalFlow');
const ApprovalRule = require('../models/ApprovalRule');
const { auth, authorize } = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');

const router = express.Router();

// @route   GET /api/approvals/pending
// @desc    Get pending approvals for current user
// @access  Private (Manager, Admin)
router.get('/pending', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // For now, get all pending expenses in the company for managers/admins to approve
    // This is a simplified approach - in a real app, you'd match against approval flows
    const expenses = await Expense.find({
      company: req.user.company,
      status: 'pending'
    })
    .populate('employee', 'firstName lastName email department')
    .populate('approvalFlow')
    .sort({ submissionDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Expense.countDocuments({
      company: req.user.company,
      status: 'pending'
    });

    res.json({
      expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/approvals/:expenseId/approve
// @desc    Approve expense
// @access  Private (Manager, Admin)
router.post('/:expenseId/approve', [
  auth,
  authorize('manager', 'admin'),
  body('comments').optional().isString().withMessage('Comments must be a string')
], async (req, res) => {
  try {
    console.log('Approve request received for expense:', req.params.expenseId);
    console.log('User:', req.user._id, req.user.role);
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { comments } = req.body;
    const expenseId = req.params.expenseId;

    console.log('Looking for expense with ID:', expenseId);
    console.log('Company:', req.user.company);
    
    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company,
      status: 'pending'
    }).populate('approvalFlow');

    console.log('Found expense:', expense ? 'YES' : 'NO');
    if (expense) {
      console.log('Expense status:', expense.status);
      console.log('Expense company:', expense.company);
      console.log('Has approval flow:', expense.approvalFlow ? 'YES' : 'NO');
    }

    if (!expense) {
      console.log('Returning 404 - expense not found or not pending');
      return res.status(404).json({ message: 'Expense not found or not pending' });
    }

    // Temporary: Allow direct approval when no approval flow exists
    if (!expense.approvalFlow) {
      console.log('No approval flow found, using direct approval');
      // Direct approval without flow
      expense.status = 'approved';
      expense.approvedBy = req.user._id;
      expense.approvedAt = new Date();
      
      // Add approval entry
      expense.approvals.push({
        approver: req.user._id,
        status: 'approved',
        comments: comments || '',
        approvedAt: new Date(),
        step: 1
      });
      
      console.log('Saving expense with direct approval...');
      await expense.save();
      
      console.log('Expense saved, fetching updated expense...');
      const updatedExpense = await Expense.findById(expenseId)
        .populate('employee', 'firstName lastName email')
        .populate('approvals.approver', 'firstName lastName email');

      console.log('Returning approved expense:', updatedExpense._id);
      return res.json(updatedExpense);
    }

    // Flow-based approval logic (for when flows are properly created)
    console.log('Expense has approval flow, fetching flow details...');
    console.log('Approval flow ID:', expense.approvalFlow);
    
    const approvalFlow = await ApprovalFlow.findById(expense.approvalFlow)
      .populate('rule')
      .populate('steps.approvers.user', 'firstName lastName email role');

    console.log('Approval flow found:', approvalFlow ? 'YES' : 'NO');
    if (approvalFlow) {
      console.log('Current step:', approvalFlow.currentStep);
      console.log('Total steps:', approvalFlow.totalSteps);
      console.log('Flow status:', approvalFlow.status);
    }

    if (!approvalFlow) {
      console.log('Returning 404 - approval flow not found');
      return res.status(404).json({ message: 'Approval flow not found' });
    }

    // Find the current step
    console.log('Looking for current step:', approvalFlow.currentStep);
    console.log('Available steps:', approvalFlow.steps.map(s => ({
      stepNumber: s.stepNumber,
      approversCount: s.approvers.length
    })));
    
    const currentStep = approvalFlow.steps.find(step => step.stepNumber === approvalFlow.currentStep);
    console.log('Current step found:', currentStep ? 'YES' : 'NO');
    
    if (!currentStep) {
      console.log('Returning 400 - no active approval step found');
      return res.status(400).json({ message: 'No active approval step found' });
    }

    // Check if current user is authorized to approve this step
    const userApprover = currentStep.approvers.find(
      approver => approver.user._id.toString() === req.user._id.toString()
    );

    if (!userApprover) {
      return res.status(403).json({ 
        message: `You are not authorized to approve this step. Only the following users can approve: ${currentStep.approvers.map(a => a.user.firstName + ' ' + a.user.lastName).join(', ')}` 
      });
    }

    if (userApprover.status !== 'pending') {
      return res.status(400).json({ message: 'You have already processed this approval step' });
    }

    // Update the approver status in the flow
    userApprover.status = 'approved';
    userApprover.approvedAt = new Date();
    userApprover.comments = comments;

    // Check if all required approvers for this step have approved
    const requiredApprovers = currentStep.approvers.filter(a => a.isRequired);
    const approvedRequired = requiredApprovers.filter(a => a.status === 'approved');

    let stepCompleted = false;
    if (approvedRequired.length === requiredApprovers.length) {
      stepCompleted = true;
    }

    // If step is completed, move to next step or complete flow
    if (stepCompleted) {
      if (approvalFlow.currentStep < approvalFlow.totalSteps) {
        // Move to next step
        approvalFlow.currentStep += 1;
        await approvalFlow.save();
        
        // Add approval entry to expense but don't approve yet
        expense.approvals.push({
          approver: req.user._id,
          status: 'approved',
          comments: comments || '',
          approvedAt: new Date(),
          step: approvalFlow.currentStep - 1
        });
        
        await expense.save();
        
        return res.json({
          message: `Step ${approvalFlow.currentStep - 1} approved. Moved to step ${approvalFlow.currentStep}.`,
          expense: await Expense.findById(expenseId).populate('employee', 'firstName lastName email'),
          nextStep: approvalFlow.currentStep
        });
      } else {
        // All steps completed - approve the expense
        approvalFlow.status = 'completed';
        approvalFlow.completedAt = new Date();
        approvalFlow.finalDecision = {
          status: 'approved',
          decidedBy: req.user._id,
          decidedAt: new Date(),
          reason: comments || 'Expense approved after completing all approval steps'
        };
        
        expense.status = 'approved';
        expense.approvedBy = req.user._id;
        expense.approvedAt = new Date();
        
        // Add final approval entry
        expense.approvals.push({
          approver: req.user._id,
          status: 'approved',
          comments: comments || '',
          approvedAt: new Date(),
          step: approvalFlow.currentStep
        });
      }
    } else {
      // Step not yet completed, just record this approval
      expense.approvals.push({
        approver: req.user._id,
        status: 'approved',
        comments: comments || '',
        approvedAt: new Date(),
        step: approvalFlow.currentStep
      });
    }

    await approvalFlow.save();
    await expense.save();

    const updatedExpense = await Expense.findById(expenseId)
      .populate('employee', 'firstName lastName email')
      .populate('approvals.approver', 'firstName lastName email');

    // Send notification to employee about approval
    const io = req.app.get('io');
    if (io) {
      try {
        await NotificationService.createExpenseApprovedNotification(updatedExpense, req.user, io);
      } catch (notificationError) {
        console.error('Error sending expense approval notification:', notificationError);
        // Don't fail the approval if notification fails
      }
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/approvals/:expenseId/reject
// @desc    Reject expense
// @access  Private (Manager, Admin)
router.post('/:expenseId/reject', [
  auth,
  authorize('manager', 'admin'),
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  body('comments').optional().isString().withMessage('Comments must be a string')
], async (req, res) => {
  try {
    console.log('Reject request received for expense:', req.params.expenseId);
    console.log('User:', req.user._id, req.user.role);
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason, comments } = req.body;
    const expenseId = req.params.expenseId;

    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company,
      status: 'pending'
    }).populate('approvalFlow');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not pending' });
    }

    // Temporary: Allow direct rejection when no approval flow exists
    if (!expense.approvalFlow) {
      // Direct rejection without flow
      expense.status = 'rejected';
      expense.rejectedBy = req.user._id;
      expense.rejectedAt = new Date();
      expense.rejectionReason = reason;
      
      // Add rejection entry
      expense.approvals.push({
        approver: req.user._id,
        status: 'rejected',
        comments: comments || '',
        rejectedAt: new Date(),
        step: 1
      });
      
      await expense.save();
      
      const updatedExpense = await Expense.findById(expenseId)
        .populate('employee', 'firstName lastName email')
        .populate('approvals.approver', 'firstName lastName email');

      return res.json(updatedExpense);
    }

    // Flow-based rejection logic (for when flows are properly created)
    const approvalFlow = await ApprovalFlow.findById(expense.approvalFlow)
      .populate('rule')
      .populate('steps.approvers.user', 'firstName lastName email role');

    if (!approvalFlow) {
      return res.status(404).json({ message: 'Approval flow not found' });
    }

    // Find the current step
    const currentStep = approvalFlow.steps.find(step => step.stepNumber === approvalFlow.currentStep);
    if (!currentStep) {
      return res.status(400).json({ message: 'No active approval step found' });
    }

    // Check if current user is authorized to reject this step
    const userApprover = currentStep.approvers.find(
      approver => approver.user._id.toString() === req.user._id.toString()
    );

    if (!userApprover) {
      return res.status(403).json({ 
        message: `You are not authorized to reject this step. Only the following users can reject: ${currentStep.approvers.map(a => a.user.firstName + ' ' + a.user.lastName).join(', ')}` 
      });
    }

    if (userApprover.status !== 'pending') {
      return res.status(400).json({ message: 'You have already processed this approval step' });
    }

    // Update the approver status in the flow
    userApprover.status = 'rejected';
    userApprover.rejectedAt = new Date();
    userApprover.comments = comments;

    // Reject the entire flow and expense
    approvalFlow.status = 'rejected';
    approvalFlow.completedAt = new Date();
    approvalFlow.finalDecision = {
      status: 'rejected',
      decidedBy: req.user._id,
      decidedAt: new Date(),
      reason: reason
    };

    expense.status = 'rejected';
    expense.rejectedBy = req.user._id;
    expense.rejectedAt = new Date();
    expense.rejectionReason = reason;

    // Add rejection entry to approvals
    expense.approvals.push({
      approver: req.user._id,
      status: 'rejected',
      comments: comments || '',
      rejectedAt: new Date(),
      step: approvalFlow.currentStep
    });

    await approvalFlow.save();
    await expense.save();

    const updatedExpense = await Expense.findById(expenseId)
      .populate('employee', 'firstName lastName email')
      .populate('approvals.approver', 'firstName lastName email');

    // Send notification to employee about rejection
    const io = req.app.get('io');
    if (io) {
      try {
        await NotificationService.createExpenseRejectedNotification(updatedExpense, req.user, reason, io);
      } catch (notificationError) {
        console.error('Error sending expense rejection notification:', notificationError);
        // Don't fail the rejection if notification fails
      }
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/approvals/rules
// @desc    Get approval rules for company
// @access  Private (Admin)
router.get('/rules', auth, authorize('admin'), async (req, res) => {
  try {
    const rules = await ApprovalRule.find({
      company: req.user.company,
      isActive: true
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });

    res.json(rules);
  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/approvals/rules
// @desc    Create approval rule
// @access  Private (Admin)
router.post('/rules', [
  auth,
  authorize('admin'),
  body('name').notEmpty().withMessage('Rule name is required'),
  body('approvalSteps').isArray().withMessage('Approval steps must be an array'),
  body('approvalLogic.type').isIn(['sequential', 'percentage', 'specific_approver', 'hybrid']).withMessage('Invalid approval logic type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      conditions,
      approvalSteps,
      approvalLogic,
      escalation
    } = req.body;

    const rule = new ApprovalRule({
      name,
      description,
      company: req.user.company,
      conditions: conditions || {},
      approvalSteps,
      approvalLogic,
      escalation: escalation || { enabled: false },
      createdBy: req.user._id
    });

    await rule.save();

    const createdRule = await ApprovalRule.findById(rule._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(createdRule);
  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/approvals/flows
// @desc    Get all approval flows for company
// @access  Private (Manager, Admin)
router.get('/flows', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { company: req.user.company };
    if (status) {
      query.status = status;
    }

    const flows = await ApprovalFlow.find(query)
      .populate({
        path: 'expense',
        populate: {
          path: 'employee',
          select: 'firstName lastName email'
        }
      })
      .populate('rule', 'name description')
      .populate('steps.approvers.user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApprovalFlow.countDocuments(query);

    res.json({
      flows,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get approval flows error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/approvals/flows/:id
// @desc    Get single approval flow
// @access  Private (Manager, Admin)
router.get('/flows/:id', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const flow = await ApprovalFlow.findOne({
      _id: req.params.id,
      company: req.user.company
    })
    .populate({
      path: 'expense',
      populate: {
        path: 'employee',
        select: 'firstName lastName email department'
      }
    })
    .populate('rule', 'name description priority')
    .populate('steps.approvers.user', 'firstName lastName email role');

    if (!flow) {
      return res.status(404).json({ message: 'Approval flow not found' });
    }

    res.json(flow);
  } catch (error) {
    console.error('Get approval flow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/approvals/flows/:id/approve
// @desc    Approve a step in approval flow
// @access  Private (Manager, Admin)
router.post('/flows/:id/approve', [
  auth,
  authorize('manager', 'admin'),
  body('comment').optional().isString().withMessage('Comment must be a string')
], async (req, res) => {
  try {
    const { comment } = req.body;
    const flowId = req.params.id;

    const flow = await ApprovalFlow.findOne({
      _id: flowId,
      company: req.user.company
    }).populate('expense');

    if (!flow) {
      return res.status(404).json({ message: 'Approval flow not found' });
    }

    // Find the current step and check if user is authorized
    const currentStep = flow.steps.find(step => step.stepNumber === flow.currentStep);
    if (!currentStep) {
      return res.status(400).json({ message: 'No active step found' });
    }

    const userApprover = currentStep.approvers.find(
      approver => approver.user.toString() === req.user._id.toString()
    );

    if (!userApprover) {
      return res.status(403).json({ message: 'You are not authorized to approve this step' });
    }

    if (userApprover.status !== 'pending') {
      return res.status(400).json({ message: 'Step already processed' });
    }

    // Update approver status
    userApprover.status = 'approved';
    userApprover.approvedAt = new Date();
    userApprover.comments = comment;

    // Check if step is complete
    const allRequired = currentStep.approvers.filter(a => a.isRequired);
    const approvedRequired = allRequired.filter(a => a.status === 'approved');

    if (approvedRequired.length === allRequired.length) {
      // Step is complete, move to next step or complete flow
      if (flow.currentStep < flow.totalSteps) {
        flow.currentStep += 1;
      } else {
        // Flow is complete
        flow.status = 'completed';
        flow.completedAt = new Date();
        
        // Update expense status
        const expense = await Expense.findById(flow.expense);
        expense.status = 'approved';
        expense.approvedBy = req.user._id;
        expense.approvedAt = new Date();
        await expense.save();
      }
    }

    await flow.save();

    res.json({ 
      message: 'Approval submitted successfully',
      flow: await ApprovalFlow.findById(flowId)
        .populate('expense')
        .populate('steps.approvers.user', 'firstName lastName email')
    });
  } catch (error) {
    console.error('Approve flow step error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/approvals/flows/:id/reject
// @desc    Reject a step in approval flow
// @access  Private (Manager, Admin)
router.post('/flows/:id/reject', [
  auth,
  authorize('manager', 'admin'),
  body('comment').notEmpty().withMessage('Rejection comment is required')
], async (req, res) => {
  try {
    const { comment } = req.body;
    const flowId = req.params.id;

    const flow = await ApprovalFlow.findOne({
      _id: flowId,
      company: req.user.company
    }).populate('expense');

    if (!flow) {
      return res.status(404).json({ message: 'Approval flow not found' });
    }

    // Find the current step and check if user is authorized
    const currentStep = flow.steps.find(step => step.stepNumber === flow.currentStep);
    if (!currentStep) {
      return res.status(400).json({ message: 'No active step found' });
    }

    const userApprover = currentStep.approvers.find(
      approver => approver.user.toString() === req.user._id.toString()
    );

    if (!userApprover) {
      return res.status(403).json({ message: 'You are not authorized to reject this step' });
    }

    if (userApprover.status !== 'pending') {
      return res.status(400).json({ message: 'Step already processed' });
    }

    // Update approver status
    userApprover.status = 'rejected';
    userApprover.rejectedAt = new Date();
    userApprover.comments = comment;

    // Reject the entire flow
    flow.status = 'rejected';
    flow.completedAt = new Date();

    // Update expense status
    const expense = await Expense.findById(flow.expense);
    expense.status = 'rejected';
    expense.rejectedBy = req.user._id;
    expense.rejectedAt = new Date();
    expense.rejectionReason = comment;
    await expense.save();

    await flow.save();

    res.json({ 
      message: 'Expense rejected successfully',
      flow: await ApprovalFlow.findById(flowId)
        .populate('expense')
        .populate('steps.approvers.user', 'firstName lastName email')
    });
  } catch (error) {
    console.error('Reject flow step error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/approvals/flows
// @desc    Create approval flow for expense
// @access  Private (Admin, Manager)
router.post('/flows', [
  auth,
  authorize('admin', 'manager'),
  body('expenseId').notEmpty().withMessage('Expense ID is required'),
  body('ruleId').notEmpty().withMessage('Rule ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { expenseId, ruleId } = req.body;

    // Check if expense exists and belongs to the company
    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if expense already has an approval flow
    if (expense.approvalFlow) {
      return res.status(400).json({ message: 'Expense already has an approval flow' });
    }

    // Get the approval rule
    const rule = await ApprovalRule.findOne({
      _id: ruleId,
      company: req.user.company,
      isActive: true
    }).populate('approvalSteps.approvers', 'firstName lastName email role');

    if (!rule) {
      return res.status(404).json({ message: 'Approval rule not found or inactive' });
    }

    // Create approval flow
    const approvalFlow = new ApprovalFlow({
      company: req.user.company,
      expense: expenseId,
      rule: ruleId,
      totalSteps: rule.approvalSteps.length,
      currentStep: 1,
      steps: rule.approvalSteps.map(step => ({
        stepNumber: step.stepNumber,
        approvers: step.approvers.map(approver => ({
          user: approver._id,
          status: 'pending',
          isRequired: step.isRequired
        }))
      }))
    });

    await approvalFlow.save();

    // Update expense with approval flow reference
    expense.approvalFlow = approvalFlow._id;
    await expense.save();

    const populatedFlow = await ApprovalFlow.findById(approvalFlow._id)
      .populate({
        path: 'expense',
        populate: {
          path: 'employee',
          select: 'firstName lastName email'
        }
      })
      .populate('rule', 'name description')
      .populate('steps.approvers.user', 'firstName lastName email role');

    res.status(201).json({
      message: 'Approval flow created successfully',
      flow: populatedFlow
    });
  } catch (error) {
    console.error('Create approval flow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
