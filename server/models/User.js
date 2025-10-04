const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'admin'],
    default: 'employee'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isManagerApprover: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
    validate: {
      validator: function(value) {
        // Allow null, undefined, or valid ObjectId
        return value === null || value === undefined || mongoose.Types.ObjectId.isValid(value);
      },
      message: 'Department must be a valid ObjectId or null'
    }
  },
  employeeId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ company: 1, role: 1 });
userSchema.index({ manager: 1 });

// Handle department field before saving
userSchema.pre('save', function(next) {
  // Convert empty strings to null for department field
  if (this.department === '' || this.department === 'undefined' || this.department === 'null') {
    this.department = null;
  }
  next();
});

// Handle department field before updating
userSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (update.department === '' || update.department === 'undefined' || update.department === 'null') {
    update.department = null;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Transform output
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
