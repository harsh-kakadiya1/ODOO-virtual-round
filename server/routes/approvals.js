const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const ApprovalFlow = require('../models/ApprovalFlow');
const ApprovalRule = require('../models/ApprovalRule');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/approvals/pending
// @desc    Get pending approvals for current user
// @access  Private (Manager, Admin)
router.get('/pending', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Find expenses where current user is an approver
    const expenses = await Expense.find({
      company: req.user.company,
      status: 'pending',
      'approvals.approver': req.user._id,
      'approvals.status': 'pending'
    })
    .populate('employee', 'firstName lastName email department')
    .populate('approvalFlow')
    .sort({ submissionDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Expense.countDocuments({
      company: req.user.company,
      status: 'pending',
      'approvals.approver': req.user._id,
      'approvals.status': 'pending'
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { comments } = req.body;
    const expenseId = req.params.expenseId;

    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company,
      status: 'pending'
    }).populate('approvalFlow');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not pending' });
    }

    // Check if user is authorized to approve this expense
    const approval = expense.approvals.find(
      app => app.approver.toString() === req.user._id.toString() && app.status === 'pending'
    );

    if (!approval) {
      return res.status(403).json({ message: 'Not authorized to approve this expense' });
    }

    // Update approval
    approval.status = 'approved';
    approval.comments = comments || '';
    approval.approvedAt = new Date();

    // Check if all required approvals are completed
    const pendingApprovals = expense.approvals.filter(app => app.status === 'pending');
    const requiredApprovals = expense.approvals.filter(app => app.isRequired && app.status !== 'approved');

    if (requiredApprovals.length === 0) {
      // All required approvals completed
      expense.status = 'approved';
      expense.approvedBy = req.user._id;
      expense.approvedAt = new Date();

      // Update approval flow
      if (expense.approvalFlow) {
        const approvalFlow = await ApprovalFlow.findById(expense.approvalFlow);
        if (approvalFlow) {
          approvalFlow.status = 'completed';
          approvalFlow.completedAt = new Date();
          approvalFlow.finalDecision = {
            status: 'approved',
            decidedBy: req.user._id,
            decidedAt: new Date()
          };
          await approvalFlow.save();
        }
      }
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expenseId)
      .populate('employee', 'firstName lastName email')
      .populate('approvals.approver', 'firstName lastName email');

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

    // Check if user is authorized to reject this expense
    const approval = expense.approvals.find(
      app => app.approver.toString() === req.user._id.toString() && app.status === 'pending'
    );

    if (!approval) {
      return res.status(403).json({ message: 'Not authorized to reject this expense' });
    }

    // Update approval
    approval.status = 'rejected';
    approval.comments = comments || '';
    approval.rejectedAt = new Date();

    // Reject the entire expense
    expense.status = 'rejected';
    expense.rejectedBy = req.user._id;
    expense.rejectedAt = new Date();
    expense.rejectionReason = reason;

    // Update approval flow
    if (expense.approvalFlow) {
      const approvalFlow = await ApprovalFlow.findById(expense.approvalFlow);
      if (approvalFlow) {
        approvalFlow.status = 'completed';
        approvalFlow.completedAt = new Date();
        approvalFlow.finalDecision = {
          status: 'rejected',
          decidedBy: req.user._id,
          decidedAt: new Date(),
          reason: reason
        };
        await approvalFlow.save();
      }
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expenseId)
      .populate('employee', 'firstName lastName email')
      .populate('approvals.approver', 'firstName lastName email');

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

module.exports = router;
