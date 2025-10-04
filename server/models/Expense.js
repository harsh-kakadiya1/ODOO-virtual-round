const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    length: [3, 'Currency must be 3 characters (ISO code)']
  },
  amountInCompanyCurrency: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  receipt: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  approvalFlow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalFlow'
  },
  approvals: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [500, 'Comments cannot exceed 500 characters']
    },
    approvedAt: Date,
    step: {
      type: Number,
      required: true
    }
  }],
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  tags: [{
    type: String,
    trim: true
  }],
  isReimbursed: {
    type: Boolean,
    default: false
  },
  reimbursementDate: Date,
  reimbursementMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check', 'other'],
    default: 'bank_transfer'
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ employee: 1, status: 1 });
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ submissionDate: -1 });
expenseSchema.index({ 'approvals.approver': 1, 'approvals.status': 1 });

// Transform output
expenseSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
