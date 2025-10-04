const sendNotification = (io, notification) => {
  const { companyId, recipient, type, title, message, data } = notification;

  // Send to specific company room
  if (companyId) {
    io.to(`company-${companyId}`).emit('notification', {
      id: Date.now().toString(),
      type,
      title,
      message,
      data,
      timestamp: new Date(),
      recipient
    });
  }
};

const notificationTypes = {
  EXPENSE_SUBMITTED: 'expense_submitted',
  EXPENSE_APPROVED: 'expense_approved',
  EXPENSE_REJECTED: 'expense_rejected',
  EXPENSE_NEEDS_APPROVAL: 'expense_needs_approval',
  EXPENSE_REIMBURSED: 'expense_reimbursed'
};

const createExpenseNotification = (type, expense, submitter, approver = null) => {
  const notifications = {
    [notificationTypes.EXPENSE_SUBMITTED]: {
      title: 'New Expense Submitted',
      message: `${submitter.firstName} ${submitter.lastName} submitted an expense for ${expense.currency} ${expense.amount}`,
      recipient: 'managers' // All managers and admins
    },
    [notificationTypes.EXPENSE_APPROVED]: {
      title: 'Expense Approved',
      message: `Your expense for ${expense.currency} ${expense.amount} has been approved by ${approver?.firstName} ${approver?.lastName}`,
      recipient: 'employee' // The expense submitter
    },
    [notificationTypes.EXPENSE_REJECTED]: {
      title: 'Expense Rejected',
      message: `Your expense for ${expense.currency} ${expense.amount} has been rejected by ${approver?.firstName} ${approver?.lastName}`,
      recipient: 'employee' // The expense submitter
    },
    [notificationTypes.EXPENSE_NEEDS_APPROVAL]: {
      title: 'Expense Needs Your Approval',
      message: `${submitter.firstName} ${submitter.lastName} submitted an expense for ${expense.currency} ${expense.amount} that requires your approval`,
      recipient: 'approver' // Specific approver
    },
    [notificationTypes.EXPENSE_REIMBURSED]: {
      title: 'Expense Reimbursed',
      message: `Your expense for ${expense.currency} ${expense.amount} has been reimbursed`,
      recipient: 'employee' // The expense submitter
    }
  };

  return {
    type,
    ...notifications[type],
    data: {
      expenseId: expense._id,
      amount: expense.amount,
      currency: expense.currency,
      submitterId: submitter._id,
      approverId: approver?._id
    }
  };
};

module.exports = {
  sendNotification,
  notificationTypes,
  createExpenseNotification
};