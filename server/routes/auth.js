const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user and create company
// @access  Public
router.post('/register', [
  body('firstName').notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 30 }).withMessage('First name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('First name can only contain letters and spaces'),
  body('lastName').notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 30 }).withMessage('Last name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Last name can only contain letters and spaces'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('companyName').notEmpty().withMessage('Company name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Company name must be between 2 and 50 characters'),
  body('country').notEmpty().withMessage('Country is required'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }

    const { firstName, lastName, email, password, companyName, country, currency } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        message: 'Registration failed',
        errors: [{ field: 'email', message: 'Email is already registered' }]
      });
    }

    // Check if company name already exists (case-insensitive, trim whitespace)
    const normalizedCompanyName = companyName.trim().toLowerCase();
    let existingCompany = await Company.findOne({ 
      name: { $regex: new RegExp(`^${normalizedCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingCompany) {
      return res.status(400).json({ 
        message: 'Registration failed',
        errors: [{ field: 'companyName', message: 'Company name is already taken. Please choose a different name.' }]
      });
    }

    // Create company with currency based on country
    const company = new Company({
      name: companyName.trim(),
      country,
      currency: currency.toUpperCase(),
      settings: {
        expenseCategories: ['Travel', 'Meals', 'Office Supplies', 'Transportation', 'Accommodation', 'Other'],
        autoApproveLimit: 0,
        requireReceipts: true
      }
    });
    await company.save();

    // Create admin user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      company: company._id,
      isManagerApprover: true
    });
    await user.save();

    // Create default departments for the company
    const Department = require('../models/Department');
    const defaultDepartments = await Department.createDefaultDepartments(company._id, user._id);
    
    // Update company with department references
    company.departments = defaultDepartments.map(dept => dept._id);
    await company.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: {
          id: company._id,
          name: company.name,
          currency: company.currency
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password').populate('company');
    if (!user) {
      return res.status(400).json({ 
        message: 'Login failed',
        errors: [{ field: 'email', message: 'No account found with this email address' }]
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ 
        message: 'Login failed',
        errors: [{ field: 'email', message: 'Account is deactivated. Please contact your administrator.' }]
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Login failed',
        errors: [{ field: 'password', message: 'Incorrect password' }]
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('company')
      .populate('manager', 'firstName lastName email')
      .populate('department', 'name description');
    
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      company: user.company,
      manager: user.manager,
      isManagerApprover: user.isManagerApprover,
      department: user.department,
      employeeId: user.employeeId
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/check-company/:name
// @desc    Check if company name exists
// @access  Public
router.get('/check-company/:name', async (req, res) => {
  try {
    const companyName = req.params.name;
    const normalizedCompanyName = companyName.trim().toLowerCase();
    
    const existingCompany = await Company.findOne({ 
      name: { $regex: new RegExp(`^${normalizedCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    res.json({
      exists: !!existingCompany,
      companyName: companyName,
      normalizedName: normalizedCompanyName,
      foundCompany: existingCompany ? existingCompany.name : null
    });
  } catch (error) {
    console.error('Check company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/check-email/:email
// @desc    Check if email exists
// @access  Public
router.get('/check-email/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const normalizedEmail = email.trim().toLowerCase();
    
    const existingUser = await User.findOne({ 
      email: normalizedEmail
    });
    
    res.json({
      exists: !!existingUser,
      email: email,
      normalizedEmail: normalizedEmail
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with current password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }]
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: [{ field: 'newPassword', message: 'New password must be different from current password' }]
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
