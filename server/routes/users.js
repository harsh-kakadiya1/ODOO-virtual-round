const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users in company
// @access  Private (Admin, Manager)
router.get('/', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const users = await User.find({ 
      company: req.user.company,
      isActive: true 
    })
    .populate('manager', 'firstName lastName email')
    .populate('department', 'name description')
    .select('-password')
    .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.user.company
    })
    .populate('manager', 'firstName lastName email')
    .populate('department', 'name description')
    .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user can view this profile
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin)
router.post('/', [
  auth,
  authorize('admin'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['employee', 'manager', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, manager, department, employeeId, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate manager if provided
    if (manager) {
      const managerUser = await User.findOne({
        _id: manager,
        company: req.user.company,
        role: { $in: ['manager', 'admin'] }
      });
      if (!managerUser) {
        return res.status(400).json({ message: 'Invalid manager selected' });
      }
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      company: req.user.company,
      manager: manager || null,
      department,
      employeeId,
      phone,
      isManagerApprover: role === 'manager' || role === 'admin'
    });

    await user.save();

    const createdUser = await User.findById(user._id)
      .populate('manager', 'firstName lastName email')
      .select('-password');

    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin, Self)
router.put('/:id', [
  auth,
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('role').optional().isIn(['employee', 'manager', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admin can change roles
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change user roles' });
    }

    const { firstName, lastName, email, role, manager, department, employeeId, phone, isManagerApprover } = req.body;

    // Check if email is already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Validate manager if provided
    if (manager) {
      const managerUser = await User.findOne({
        _id: manager,
        company: req.user.company,
        role: { $in: ['manager', 'admin'] }
      });
      if (!managerUser) {
        return res.status(400).json({ message: 'Invalid manager selected' });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (req.body.password) user.password = req.body.password; // Will be hashed by pre-save hook
    if (role) {
      user.role = role;
      user.isManagerApprover = role === 'manager' || role === 'admin';
    }
    if (manager !== undefined) user.manager = manager || null;
    if (department !== undefined) user.department = department;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('manager', 'firstName lastName email')
      .select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot deactivate self
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
