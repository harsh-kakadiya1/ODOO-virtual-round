const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [100, 'Rule name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  conditions: {
    amountThreshold: {
      type: Number,
      default: null // No threshold if null
    },
    categories: [{
      type: String,
      trim: true
    }],
    departments: [{
      type: String,
      trim: true
    }],
    employeeIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  approvalSteps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    approvers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isRequired: {
      type: Boolean,
      default: true
    },
    canEscalate: {
      type: Boolean,
      default: false
    }
  }],
  approvalLogic: {
    type: {
      type: String,
      enum: ['sequential', 'percentage', 'specific_approver', 'hybrid'],
      default: 'sequential'
    },
    percentageRequired: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    specificApprovers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    autoApproveOnSpecific: {
      type: Boolean,
      default: false
    }
  },
  escalation: {
    enabled: {
      type: Boolean,
      default: false
    },
    timeoutHours: {
      type: Number,
      default: 72 // 3 days
    },
    escalateTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
approvalRuleSchema.index({ company: 1, isActive: 1 });
approvalRuleSchema.index({ 'conditions.amountThreshold': 1 });
approvalRuleSchema.index({ createdBy: 1 });

// Transform output
approvalRuleSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
