const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
const ApprovalRule = require('../models/ApprovalRule');
const ApprovalFlow = require('../models/ApprovalFlow');
const { auth, authorize } = require('../middleware/auth');
const { uploadReceipt, handleUploadError, deleteFile } = require('../middleware/upload');
const currencyConverter = require('../utils/currencyConverter');
const path = require('path');
const { sendNotification, notificationTypes, createExpenseNotification } = require('../utils/notificationService');

const router = express.Router();

// Fixed populate paths for approval flows

// @route   GET /api/expenses
// @desc    Get expenses based on user role
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { company: req.user.company };

    // Role-based filtering
    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (req.user.role === 'manager') {
      // Manager can see their team's expenses
      const teamEmployees = await User.find({ 
        $or: [
          { manager: req.user._id },
          { _id: req.user._id }
        ],
        company: req.user.company
      }).select('_id');
      
      query.employee = { $in: teamEmployees.map(emp => emp._id) };
    }
    // Admin can see all expenses (no additional filter)

    // Additional filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('employee', 'firstName lastName email department')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.company
    })
    .populate('employee', 'firstName lastName email department')
    .populate('approvedBy', 'firstName lastName')
    .populate('rejectedBy', 'firstName lastName')
    .populate('approvals.approver', 'firstName lastName email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && expense.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private (Employee)
router.post('/', [
  auth,
  authorize('employee', 'manager', 'admin'),
  uploadReceipt,
  handleUploadError,
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('description').notEmpty().withMessage('Description is required'),
  body('expenseDate').isISO8601().withMessage('Valid expense date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, currency, description, expenseDate, tags } = req.body;

    // Get company information for currency conversion
    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Currency conversion using real exchange rates
    const conversion = await currencyConverter.convertAmount(
      amount, 
      currency.toUpperCase(), 
      company.currency
    );
    const exchangeRate = conversion.exchangeRate;
    const amountInCompanyCurrency = conversion.convertedAmount;

    // Check max expense limit
    if (company.settings.maxExpenseAmount && amountInCompanyCurrency > company.settings.maxExpenseAmount) {
      return res.status(400).json({ 
        message: `Expense amount exceeds maximum allowed limit of ${company.currency} ${company.settings.maxExpenseAmount}` 
      });
    }

    const expenseData = {
      employee: req.user._id,
      company: req.user.company,
      category,
      amount,
      currency: currency.toUpperCase(),
      amountInCompanyCurrency,
      exchangeRate,
      description,
      expenseDate: new Date(expenseDate),
      tags: tags || []
    };

    // Add receipt information if file was uploaded
    if (req.file) {
      expenseData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadDate: new Date()
      };
    }

    const expense = new Expense(expenseData);
    await expense.save();

    // TODO: Add approval flow creation after fixing schema populate issues
    // const user = await User.findById(req.user._id).populate('company');
    // const approvalRule = await ApprovalRule.findOne({
    //   company: user.company._id,
    //   isActive: true,
    // }).populate('approvalSteps.approvers');
    // 
    // if (approvalRule) {
    //   // Create approval flow logic here
    // }

    const createdExpense = await Expense.findById(expense._id)
      .populate('employee', 'firstName lastName email');

    // Send notification to managers and admins
    const io = req.app.get('io');
    if (io) {
      const notification = createExpenseNotification(
        notificationTypes.EXPENSE_SUBMITTED,
        createdExpense,
        createdExpense.employee
      );
      sendNotification(io, {
        ...notification,
        companyId: req.user.company
      });
    }

    res.status(201).json(createdExpense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private (Employee - own expenses only)
router.put('/:id', [
  auth,
  authorize('employee', 'manager', 'admin'),
  uploadReceipt,
  handleUploadError,
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && expense.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow editing if expense is pending
    if (expense.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot edit approved or rejected expenses' });
    }

    const { category, amount, description, tags } = req.body;

    if (category) expense.category = category;
    if (amount) {
      expense.amount = amount;
      expense.amountInCompanyCurrency = amount * expense.exchangeRate;
    }
    if (description) expense.description = description;
    if (tags) expense.tags = tags;

    // Handle receipt update
    if (req.file) {
      // Delete old receipt file if it exists
      if (expense.receipt && expense.receipt.path) {
        await deleteFile(expense.receipt.path);
      }
      
      // Update with new receipt
      expense.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadDate: new Date()
      };
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('employee', 'firstName lastName email');

    res.json(updatedExpense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Cancel expense
// @access  Private (Employee - own expenses only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && expense.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancelling if expense is pending
    if (expense.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel approved or rejected expenses' });
    }

    // Delete receipt file if exists
    if (expense.receipt && expense.receipt.path) {
      await deleteFile(expense.receipt.path);
    }

    expense.status = 'cancelled';
    await expense.save();

    res.json({ message: 'Expense cancelled successfully' });
  } catch (error) {
    console.error('Cancel expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id/receipt
// @desc    Download expense receipt
// @access  Private
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && expense.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!expense.receipt || !expense.receipt.path) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const filePath = path.resolve(expense.receipt.path);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Receipt file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${expense.receipt.originalName}"`);
    res.setHeader('Content-Type', expense.receipt.mimetype);
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
