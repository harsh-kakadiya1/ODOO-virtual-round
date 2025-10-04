const mongoose = require('mongoose');

const approvalFlowSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  expense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true
  },
  rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRule',
    required: true
  },
  currentStep: {
    type: Number,
    default: 1
  },
  totalSteps: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'rejected', 'cancelled', 'escalated'],
    default: 'active'
  },
  steps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    approvers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'skipped'],
        default: 'pending'
      },
      approvedAt: Date,
      rejectedAt: Date,
      comments: String,
      isRequired: {
        type: Boolean,
        default: true
      }
    }],
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  escalatedAt: Date,
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  finalDecision: {
    status: {
      type: String,
      enum: ['approved', 'rejected']
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    decidedAt: Date,
    reason: String
  }
}, {
  timestamps: true
});

// Index for better query performance
approvalFlowSchema.index({ expense: 1 });
approvalFlowSchema.index({ status: 1 });
approvalFlowSchema.index({ 'steps.approvers.user': 1, 'steps.approvers.status': 1 });

// Transform output
approvalFlowSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ApprovalFlow', approvalFlowSchema);
