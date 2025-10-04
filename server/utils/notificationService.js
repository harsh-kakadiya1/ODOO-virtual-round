const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @param {Object} io - Socket.IO instance for real-time updates
   */
  static async createNotification(notificationData, io = null) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Populate the notification for real-time sending
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'firstName lastName email')
        .populate('data.expenseId', 'description amount currency status');

      // Send real-time notification if Socket.IO is available
      if (io) {
        io.to(notificationData.company.toString()).emit('new-notification', {
          notification: populatedNotification,
          unreadCount: await this.getUnreadCount(notificationData.recipient)
        });
      }

      return populatedNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create expense submission notification
   * @param {Object} expense - Expense object
   * @param {Object} io - Socket.IO instance
   */
  static async createExpenseSubmittedNotification(expense, io = null) {
    try {
      // Get managers and admins in the company
      const managersAndAdmins = await User.find({
        company: expense.company,
        role: { $in: ['manager', 'admin'] }
      });

      const notifications = [];

      for (const user of managersAndAdmins) {
        const notificationData = {
          recipient: user._id,
          sender: expense.employee,
          company: expense.company,
          type: 'expense_submitted',
          title: 'New Expense Submitted',
          message: `A new expense of ${expense.currency} ${expense.amount} has been submitted for approval.`,
          data: {
            expenseId: expense._id,
            amount: expense.amount,
            currency: expense.currency,
            employeeName: `${expense.employee.firstName} ${expense.employee.lastName}`
          },
          priority: 'medium'
        };

        const notification = await this.createNotification(notificationData, io);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating expense submitted notification:', error);
      throw error;
    }
  }

  /**
   * Create auto-approval notification for managers/admins
   * @param {Object} expense - Expense object
   * @param {Object} io - Socket.IO instance
   */
  static async createAutoApprovalNotification(expense, io = null) {
    try {
      // Get managers and admins in the company
      const managersAndAdmins = await User.find({
        company: expense.company,
        role: { $in: ['manager', 'admin'] }
      });

      const notifications = [];

      for (const user of managersAndAdmins) {
        const notificationData = {
          recipient: user._id,
          sender: expense.employee,
          company: expense.company,
          type: 'expense_auto_approved',
          title: 'Expense Auto-Approved',
          message: `An expense of ${expense.currency} ${expense.amount} by ${expense.employee.firstName} ${expense.employee.lastName} has been automatically approved (within auto-approve limit).`,
          data: {
            expenseId: expense._id,
            amount: expense.amount,
            currency: expense.currency,
            employeeName: `${expense.employee.firstName} ${expense.employee.lastName}`,
            isAutoApproved: true
          },
          priority: 'low'
        };

        const notification = await this.createNotification(notificationData, io);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating auto-approval notification:', error);
      throw error;
    }
  }

  /**
   * Create expense approval notification
   * @param {Object} expense - Expense object
   * @param {Object} approver - User who approved (or system object for auto-approval)
   * @param {Object} io - Socket.IO instance
   */
  static async createExpenseApprovedNotification(expense, approver, io = null) {
    try {
      const isSystemApproval = !approver._id;
      const approverName = isSystemApproval ? 'System Auto-Approval' : `${approver.firstName} ${approver.lastName}`;
      const message = isSystemApproval 
        ? `Your expense of ${expense.currency} ${expense.amount} has been automatically approved (within auto-approve limit).`
        : `Your expense of ${expense.currency} ${expense.amount} has been approved by ${approverName}.`;

      const notificationData = {
        recipient: expense.employee,
        sender: isSystemApproval ? expense.employee : approver._id, // Use employee as sender for system approvals
        company: expense.company,
        type: 'expense_approved',
        title: isSystemApproval ? 'Expense Auto-Approved' : 'Expense Approved',
        message: message,
        data: {
          expenseId: expense._id,
          amount: expense.amount,
          currency: expense.currency,
          managerName: approverName,
          isAutoApproved: isSystemApproval
        },
        priority: 'medium'
      };

      return await this.createNotification(notificationData, io);
    } catch (error) {
      console.error('Error creating expense approved notification:', error);
      throw error;
    }
  }

  /**
   * Create expense rejection notification
   * @param {Object} expense - Expense object
   * @param {Object} rejector - User who rejected
   * @param {String} reason - Rejection reason
   * @param {Object} io - Socket.IO instance
   */
  static async createExpenseRejectedNotification(expense, rejector, reason, io = null) {
    try {
      const notificationData = {
        recipient: expense.employee,
        sender: rejector._id,
        company: expense.company,
        type: 'expense_rejected',
        title: 'Expense Rejected',
        message: `Your expense of ${expense.currency} ${expense.amount} has been rejected by ${rejector.firstName} ${rejector.lastName}.${reason ? ` Reason: ${reason}` : ''}`,
        data: {
          expenseId: expense._id,
          amount: expense.amount,
          currency: expense.currency,
          managerName: `${rejector.firstName} ${rejector.lastName}`,
          reason: reason
        },
        priority: 'high'
      };

      return await this.createNotification(notificationData, io);
    } catch (error) {
      console.error('Error creating expense rejected notification:', error);
      throw error;
    }
  }

  /**
   * Create expense deletion notification for managers/admins
   * @param {Object} expense - Expense object
   * @param {Object} deleter - User who deleted the expense
   * @param {Object} io - Socket.IO instance
   */
  static async createExpenseDeletedNotification(expense, deleter, io = null) {
    try {
      // Get managers and admins in the company
      const managersAndAdmins = await User.find({
        company: expense.company,
        role: { $in: ['manager', 'admin'] }
      });

      const notifications = [];

      for (const user of managersAndAdmins) {
        const notificationData = {
          recipient: user._id,
          sender: deleter._id,
          company: expense.company,
          type: 'expense_deleted',
          title: 'Expense Deleted',
          message: `An expense of ${expense.currency} ${expense.amount} by ${expense.employee.firstName} ${expense.employee.lastName} has been deleted by ${deleter.firstName} ${deleter.lastName}.`,
          data: {
            expenseId: expense._id,
            amount: expense.amount,
            currency: expense.currency,
            employeeName: `${expense.employee.firstName} ${expense.employee.lastName}`,
            deletedBy: `${deleter.firstName} ${deleter.lastName}`
          },
          priority: 'medium'
        };

        const notification = await this.createNotification(notificationData, io);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating expense deletion notification:', error);
      throw error;
    }
  }

  /**
   * Create approval request notification
   * @param {Object} expense - Expense object
   * @param {Object} approver - User who needs to approve
   * @param {Object} io - Socket.IO instance
   */
  static async createApprovalRequestNotification(expense, approver, io = null) {
    try {
      const notificationData = {
        recipient: approver._id,
        sender: expense.employee,
        company: expense.company,
        type: 'approval_request',
        title: 'Approval Required',
        message: `You have a pending expense approval request for ${expense.currency} ${expense.amount}.`,
    data: {
      expenseId: expense._id,
      amount: expense.amount,
      currency: expense.currency,
          employeeName: `${expense.employee.firstName} ${expense.employee.lastName}`
        },
        priority: 'high'
      };

      return await this.createNotification(notificationData, io);
    } catch (error) {
      console.error('Error creating approval request notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   * @returns {Number} Unread count
   */
  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   */
  static async markAsRead(notificationId, userId) {
    try {
      await Notification.updateOne(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   */
  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;