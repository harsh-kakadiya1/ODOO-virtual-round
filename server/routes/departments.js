const express = require('express');
const { body, validationResult } = require('express-validator');
const Department = require('../models/Department');
const Company = require('../models/Company');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/departments
// @desc    Get all departments for the user's company
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const departments = await Department.getByCompany(
      req.user.company, 
      includeInactive === 'true'
    ).populate('createdBy', 'firstName lastName');

    // Update employee counts for each department
    for (const dept of departments) {
      await dept.updateEmployeeCount();
    }

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('createdBy', 'firstName lastName');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Get employees in this department
    const employees = await User.find({
      department: department._id,
      isActive: true
    }).select('firstName lastName email role');

    res.json({
      ...department.toObject(),
      employees
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/departments
// @desc    Create a new department
// @access  Private (Admin only)
router.post('/', [
  auth,
  authorize('admin'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    // Check if department name already exists in the company
    const existingDepartment = await Department.findOne({
      company: req.user.company,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingDepartment) {
      return res.status(400).json({ 
        message: 'Department name already exists in this company' 
      });
    }

    const department = new Department({
      name,
      description,
      company: req.user.company,
      createdBy: req.user._id
    });

    await department.save();

    // Add department to company's departments array
    await Company.findByIdAndUpdate(req.user.company, {
      $push: { departments: department._id }
    });

    // Populate the createdBy field for response
    await department.populate('createdBy', 'firstName lastName');

    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update a department
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  authorize('admin'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isActive } = req.body;

    const department = await Department.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if new name conflicts with existing departments
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({
        company: req.user.company,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: department._id }
      });

      if (existingDepartment) {
        return res.status(400).json({ 
          message: 'Department name already exists in this company' 
        });
      }
    }

    // Update fields
    if (name) department.name = name;
    if (description !== undefined) department.description = description;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();
    await department.populate('createdBy', 'firstName lastName');

    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete a department
// @access  Private (Admin only)
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has employees
    const employeeCount = await User.countDocuments({
      department: department._id,
      isActive: true
    });

    if (employeeCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department. It has ${employeeCount} active employee(s). Please reassign them first.` 
      });
    }

    // Remove department from company's departments array
    await Company.findByIdAndUpdate(req.user.company, {
      $pull: { departments: department._id }
    });

    // Delete the department
    await Department.findByIdAndDelete(req.params.id);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/departments/bulk-create
// @desc    Create multiple departments at once
// @access  Private (Admin only)
router.post('/bulk-create', [
  auth,
  authorize('admin'),
  body('departments')
    .isArray({ min: 1 })
    .withMessage('Departments must be an array'),
  body('departments.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each department name must be between 1 and 100 characters'),
  body('departments.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Each description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { departments } = req.body;
    const createdDepartments = [];

    for (const deptData of departments) {
      // Check if department name already exists
      const existingDepartment = await Department.findOne({
        company: req.user.company,
        name: { $regex: new RegExp(`^${deptData.name}$`, 'i') }
      });

      if (!existingDepartment) {
        const department = new Department({
          name: deptData.name,
          description: deptData.description || '',
          company: req.user.company,
          createdBy: req.user._id
        });

        await department.save();
        createdDepartments.push(department);

        // Add to company's departments array
        await Company.findByIdAndUpdate(req.user.company, {
          $push: { departments: department._id }
        });
      }
    }

    res.status(201).json({
      message: `Created ${createdDepartments.length} department(s)`,
      departments: createdDepartments
    });
  } catch (error) {
    console.error('Bulk create departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/departments/stats
// @desc    Get department statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const departments = await Department.find({
      company: req.user.company,
      isActive: true
    });

    const stats = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await User.countDocuments({
          department: dept._id,
          isActive: true
        });

        return {
          department: dept.name,
          employeeCount,
          id: dept._id
        };
      })
    );

    res.json(stats);
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
