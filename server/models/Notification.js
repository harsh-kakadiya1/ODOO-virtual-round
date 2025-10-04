const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  type: {
    type: String,
    enum: [
      'expense_submitted',
      'expense_approved',
      'expense_rejected',
      'expense_auto_approved',
      'expense_deleted',
      'expense_requires_approval',
      'approval_request',
      'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense'
    },
    amount: Number,
    currency: String,
    employeeName: String,
    managerName: String,
    reason: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ company: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Transform output
notificationSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Notification', notificationSchema);