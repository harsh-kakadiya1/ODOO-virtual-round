const express = require('express');
const { body, validationResult } = require('express-validator');
const ApprovalRule = require('../models/ApprovalRule');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/approval-rules
// @desc    Get all approval rules for company
// @access  Private (Admin, Manager)
router.get('/', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 10, active } = req.query;
    const skip = (page - 1) * limit;

    let query = { company: req.user.company };
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const rules = await ApprovalRule.find(query)
      .populate('approvalSteps.approvers', 'firstName lastName email role')
      .populate('conditions.employeeIds', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApprovalRule.countDocuments(query);

    res.json({
      rules,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/approval-rules/available-approvers
// @desc    Get available approvers (managers and admins)
// @access  Private (Admin, Manager)
router.get('/available-approvers', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const approvers = await User.find({
      company: req.user.company,
      role: { $in: ['manager', 'admin'] },
      isActive: true
    })
    .select('firstName lastName email role department')
    .sort({ firstName: 1 });

    res.json(approvers);
  } catch (error) {
    console.error('Get available approvers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/approval-rules/:id
// @desc    Get single approval rule
// @access  Private (Admin, Manager)
router.get('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const rule = await ApprovalRule.findOne({
      _id: req.params.id,
      company: req.user.company
    })
    .populate('approvalSteps.approvers', 'firstName lastName email role')
    .populate('conditions.employeeIds', 'firstName lastName email');

    if (!rule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    res.json(rule);
  } catch (error) {
    console.error('Get approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/approval-rules
// @desc    Create new approval rule
// @access  Private (Admin only)
router.post('/', [
  auth,
  authorize('admin'),
  body('name').notEmpty().trim().withMessage('Rule name is required'),
  body('description').optional().trim(),
  body('conditions.amountThreshold').optional().isNumeric().withMessage('Amount threshold must be a number'),
  body('approvalSteps').isArray({ min: 1 }).withMessage('At least one approval step is required'),
  body('approvalSteps.*.stepNumber').isInt({ min: 1 }).withMessage('Step number must be a positive integer'),
  body('approvalSteps.*.approvers').isArray({ min: 1 }).withMessage('Each step must have at least one approver'),
  body('approvalSteps.*.isRequired').optional().isBoolean()
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
      priority,
      isActive
    } = req.body;

    // Validate approvers exist and are managers/admins
    const allApproverIds = approvalSteps.flatMap(step => step.approvers);
    const approvers = await User.find({
      _id: { $in: allApproverIds },
      company: req.user.company,
      role: { $in: ['manager', 'admin'] }
    });

    if (approvers.length !== allApproverIds.length) {
      return res.status(400).json({ 
        message: 'All approvers must be valid managers or admins from your company' 
      });
    }

    // Validate employee IDs if provided
    if (conditions?.employeeIds?.length > 0) {
      const employees = await User.find({
        _id: { $in: conditions.employeeIds },
        company: req.user.company
      });

      if (employees.length !== conditions.employeeIds.length) {
        return res.status(400).json({ 
          message: 'All specified employees must be valid users from your company' 
        });
      }
    }

    const rule = new ApprovalRule({
      company: req.user.company,
      name,
      description,
      conditions: conditions || {},
      approvalSteps,
      priority: priority || 1,
      isActive: isActive !== false,
      createdBy: req.user._id
    });

    await rule.save();

    const createdRule = await ApprovalRule.findById(rule._id)
      .populate('approvalSteps.approvers', 'firstName lastName email role')
      .populate('conditions.employeeIds', 'firstName lastName email');

    res.status(201).json(createdRule);
  } catch (error) {
    console.error('Create approval rule error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A rule with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/approval-rules/:id
// @desc    Update approval rule
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  authorize('admin'),
  body('name').optional().notEmpty().trim().withMessage('Rule name cannot be empty'),
  body('description').optional().trim(),
  body('conditions.amountThreshold').optional().isNumeric().withMessage('Amount threshold must be a number'),
  body('approvalSteps').optional().isArray({ min: 1 }).withMessage('At least one approval step is required'),
  body('approvalSteps.*.stepNumber').optional().isInt({ min: 1 }).withMessage('Step number must be a positive integer'),
  body('approvalSteps.*.approvers').optional().isArray({ min: 1 }).withMessage('Each step must have at least one approver')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rule = await ApprovalRule.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!rule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    const {
      name,
      description,
      conditions,
      approvalSteps,
      priority,
      isActive
    } = req.body;

    // Validate approvers if provided
    if (approvalSteps) {
      const allApproverIds = approvalSteps.flatMap(step => step.approvers);
      const approvers = await User.find({
        _id: { $in: allApproverIds },
        company: req.user.company,
        role: { $in: ['manager', 'admin'] }
      });

      if (approvers.length !== allApproverIds.length) {
        return res.status(400).json({ 
          message: 'All approvers must be valid managers or admins from your company' 
        });
      }
    }

    // Update fields
    if (name) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (conditions) rule.conditions = { ...rule.conditions, ...conditions };
    if (approvalSteps) rule.approvalSteps = approvalSteps;
    if (priority) rule.priority = priority;
    if (isActive !== undefined) rule.isActive = isActive;
    
    rule.updatedAt = new Date();

    await rule.save();

    const updatedRule = await ApprovalRule.findById(rule._id)
      .populate('approvalSteps.approvers', 'firstName lastName email role')
      .populate('conditions.employeeIds', 'firstName lastName email');

    res.json(updatedRule);
  } catch (error) {
    console.error('Update approval rule error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A rule with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/approval-rules/:id
// @desc    Delete approval rule
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const rule = await ApprovalRule.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!rule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    // Check if rule is in use (has active approval flows)
    const ApprovalFlow = require('../models/ApprovalFlow');
    const activeFlows = await ApprovalFlow.countDocuments({
      rule: rule._id,
      status: { $in: ['active', 'pending'] }
    });

    if (activeFlows > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete rule that is currently in use by active approval flows' 
      });
    }

    await ApprovalRule.findByIdAndDelete(rule._id);
    res.json({ message: 'Approval rule deleted successfully' });
  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/approval-rules/:id/toggle
// @desc    Toggle approval rule active status
// @access  Private (Admin only)
router.patch('/:id/toggle', auth, authorize('admin'), async (req, res) => {
  try {
    const rule = await ApprovalRule.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!rule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date();
    await rule.save();

    res.json({ 
      message: `Approval rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
      rule: {
        _id: rule._id,
        name: rule.name,
        isActive: rule.isActive
      }
    });
  } catch (error) {
    console.error('Toggle approval rule status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;