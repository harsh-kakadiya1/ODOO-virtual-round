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
      enum: ['sequential', 'percentage', 'specific_approver', 'hybrid', 'conditional', 'hierarchical'],
      default: 'hierarchical'
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
    },
    // Hierarchical approval settings
    hierarchicalSettings: {
      requireAllSelected: {
        type: Boolean,
        default: true
      },
      allowPartialApproval: {
        type: Boolean,
        default: false
      },
      escalationEnabled: {
        type: Boolean,
        default: false
      },
      escalationTimeoutHours: {
        type: Number,
        default: 72,
        min: 1
      },
      escalationTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // Conditional rules for hybrid approval
    conditionalRules: [{
      ruleType: {
        type: String,
        enum: ['percentage', 'specific_approver', 'amount_threshold', 'category', 'department'],
        required: true
      },
      condition: {
        // For percentage rule
        percentage: {
          type: Number,
          min: 0,
          max: 100
        },
        // For specific approver rule
        approverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        // For amount threshold rule
        amountThreshold: {
          type: Number,
          min: 0
        },
        // For category rule
        category: {
          type: String,
          trim: true
        },
        // For department rule
        department: {
          type: String,
          trim: true
        }
      },
      action: {
        type: String,
        enum: ['auto_approve', 'auto_reject', 'skip_step', 'require_additional'],
        required: true
      },
      additionalApprovers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    // Logic operator for combining multiple rules
    ruleOperator: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'OR'
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
