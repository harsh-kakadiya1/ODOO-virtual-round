const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
departmentSchema.index({ company: 1, name: 1 }, { unique: true });
departmentSchema.index({ company: 1, isActive: 1 });

// Virtual for getting employees in this department
departmentSchema.virtual('employees', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department'
});

// Method to update employee count
departmentSchema.methods.updateEmployeeCount = async function() {
  const User = mongoose.model('User');
  const count = await User.countDocuments({ 
    department: this._id, 
    isActive: true 
  });
  this.employeeCount = count;
  await this.save();
  return count;
};

// Pre-save middleware to ensure unique department names within a company
departmentSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    const existingDepartment = await this.constructor.findOne({
      company: this.company,
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id }
    });
    
    if (existingDepartment) {
      const error = new Error('Department name already exists in this company');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Static method to get departments by company
departmentSchema.statics.getByCompany = function(companyId, includeInactive = false) {
  const query = { company: companyId };
  if (!includeInactive) {
    query.isActive = true;
  }
  return this.find(query).sort({ name: 1 });
};

// Static method to create default departments for a new company
departmentSchema.statics.createDefaultDepartments = async function(companyId, createdBy) {
  const defaultDepartments = [
    { name: 'Engineering', description: 'Software development and technical teams' },
    { name: 'Sales', description: 'Sales and business development' },
    { name: 'Marketing', description: 'Marketing and communications' },
    { name: 'Human Resources', description: 'HR and people operations' },
    { name: 'Finance', description: 'Finance and accounting' },
    { name: 'Operations', description: 'Operations and administration' }
  ];

  const departments = [];
  for (const dept of defaultDepartments) {
    const department = new this({
      ...dept,
      company: companyId,
      createdBy: createdBy
    });
    await department.save();
    departments.push(department);
  }
  
  return departments;
};

module.exports = mongoose.model('Department', departmentSchema);
