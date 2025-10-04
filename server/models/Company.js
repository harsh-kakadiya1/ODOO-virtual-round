const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    trim: true,
    uppercase: true,
    length: [3, 'Currency must be 3 characters (ISO code)']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  logo: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  settings: {
    autoApproveLimit: {
      type: Number,
      default: 0 // Amount below which expenses are auto-approved
    },
    requireReceipts: {
      type: Boolean,
      default: true
    },
    maxExpenseAmount: {
      type: Number,
      default: null // No limit if null
    },
    expenseCategories: [{
      type: String,
      trim: true
    }],
    approvalRules: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalRule'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    expiresAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
companySchema.index({ name: 1 });
companySchema.index({ country: 1 });

// Transform output
companySchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Company', companySchema);
