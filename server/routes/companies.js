const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/companies
// @desc    Get company information
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/companies
// @desc    Update company information
// @access  Private (Admin)
router.put('/', [
  auth,
  authorize('admin'),
  body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('country').optional().notEmpty().withMessage('Country cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { 
      name, 
      country, 
      currency, 
      timezone, 
      address, 
      contact, 
      settings 
    } = req.body;

    if (name) company.name = name;
    if (country) company.country = country;
    if (currency) company.currency = currency.toUpperCase();
    if (timezone) company.timezone = timezone;
    if (address) company.address = { ...company.address, ...address };
    if (contact) company.contact = { ...company.contact, ...contact };
    if (settings) company.settings = { ...company.settings, ...settings };

    await company.save();
    res.json(company);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/companies/settings
// @desc    Update company settings
// @access  Private (Admin)
router.put('/settings', [
  auth,
  authorize('admin'),
  body('expenseCategories').optional().isArray().withMessage('Expense categories must be an array'),
  body('autoApproveLimit').optional().isNumeric().withMessage('Auto approve limit must be a number'),
  body('maxExpenseAmount').optional().isNumeric().withMessage('Max expense amount must be a number'),
  body('requireReceipts').optional().isBoolean().withMessage('Require receipts must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { 
      expenseCategories, 
      autoApproveLimit, 
      maxExpenseAmount, 
      requireReceipts 
    } = req.body;

    if (expenseCategories !== undefined) company.settings.expenseCategories = expenseCategories;
    if (autoApproveLimit !== undefined) company.settings.autoApproveLimit = autoApproveLimit;
    if (maxExpenseAmount !== undefined) company.settings.maxExpenseAmount = maxExpenseAmount;
    if (requireReceipts !== undefined) company.settings.requireReceipts = requireReceipts;

    await company.save();
    res.json(company.settings);
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
