const ApprovalFlow = require('../models/ApprovalFlow');
const Expense = require('../models/Expense');
const User = require('../models/User');
const NotificationService = require('./notificationService');

class HierarchicalApprovalEngine {
  /**
   * Create approval flow for hierarchical approval
   * @param {Object} expense - Expense object
   * @param {Object} rule - ApprovalRule object with hierarchical settings
   * @returns {Object} Created approval flow
   */
  static async createHierarchicalApprovalFlow(expense, rule) {
    try {
      const { hierarchicalSettings } = rule.approvalLogic;
      
      // Get all approvers from all steps
      const allApprovers = rule.approvalSteps.flatMap(step => step.approvers);
      const uniqueApprovers = [...new Set(allApprovers.map(String))];
      
      // Create approval flow with hierarchical structure
      const approvalFlow = new ApprovalFlow({
        company: expense.company,
        expense: expense._id,
        rule: rule._id,
        currentStep: 1,
        totalSteps: rule.approvalSteps.length,
        status: 'active',
        steps: rule.approvalSteps.map((step, index) => ({
          stepNumber: step.stepNumber,
          approvers: step.approvers.map(approverId => ({
            user: approverId,
            status: 'pending',
            isRequired: step.isRequired,
            canEscalate: step.canEscalate
          })),
          isCompleted: false,
          isEscalated: false
        })),
        startedAt: new Date()
      });

      // Set escalation settings if enabled
      if (hierarchicalSettings.escalationEnabled) {
        approvalFlow.escalatedAt = new Date(Date.now() + (hierarchicalSettings.escalationTimeoutHours * 60 * 60 * 1000));
        approvalFlow.escalatedTo = hierarchicalSettings.escalationTo;
      }

      await approvalFlow.save();

      return approvalFlow;
    } catch (error) {
      console.error('Error creating hierarchical approval flow:', error);
      throw error;
    }
  }

  /**
   * Process hierarchical approval
   * @param {Object} expense - Expense object
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {Object} rule - ApprovalRule object
   * @param {Object} approver - User object who is approving
   * @param {String} action - 'approve' or 'reject'
   * @param {String} comments - Approval/rejection comments
   * @param {Object} io - Socket.io instance for notifications
   * @returns {Object} Processing result
   */
  static async processHierarchicalApproval(expense, approvalFlow, rule, approver, action, comments, io = null) {
    try {
      const { hierarchicalSettings } = rule.approvalLogic;
      
      // Find the current step and approver
      const currentStep = approvalFlow.steps.find(step => step.stepNumber === approvalFlow.currentStep);
      if (!currentStep) {
        throw new Error('Current approval step not found');
      }

      const approverInStep = currentStep.approvers.find(
        approverObj => approverObj.user.toString() === approver._id.toString()
      );

      if (!approverInStep) {
        throw new Error('User is not authorized to approve this expense');
      }

      if (approverInStep.status !== 'pending') {
        throw new Error('This approval has already been processed');
      }

      // Update approver status
      approverInStep.status = action;
      approverInStep.comments = comments;
      
      if (action === 'approved') {
        approverInStep.approvedAt = new Date();
      } else {
        approverInStep.rejectedAt = new Date();
      }

      // Check if current step is completed
      const stepResult = this.evaluateStepCompletion(currentStep, hierarchicalSettings);
      
      if (stepResult.isCompleted) {
        currentStep.isCompleted = true;
        currentStep.completedAt = new Date();
        
        if (stepResult.status === 'rejected') {
          // Step rejected - reject entire expense
          approvalFlow.status = 'rejected';
          approvalFlow.completedAt = new Date();
          approvalFlow.finalDecision = {
            status: 'rejected',
            decidedBy: approver._id,
            decidedAt: new Date(),
            reason: 'Rejected by approver in hierarchical flow'
          };
          
          expense.status = 'rejected';
          expense.rejectedBy = approver._id;
          expense.rejectedAt = new Date();
          expense.rejectionReason = comments || 'Rejected in approval process';
          
          await expense.save();
          await approvalFlow.save();
          
          // Send notification
          if (io) {
            try {
              await NotificationService.createExpenseRejectedNotification(expense, approver, io);
            } catch (notificationError) {
              console.error('Error sending rejection notification:', notificationError);
            }
          }
          
          return {
            success: true,
            status: 'rejected',
            message: 'Expense rejected successfully',
            nextStep: null,
            isComplete: true
          };
        } else {
          // Step approved - move to next step or complete
          if (approvalFlow.currentStep < approvalFlow.totalSteps) {
            approvalFlow.currentStep += 1;
            await approvalFlow.save();
            
            // Send notification for next step
            if (io) {
              try {
                const nextStep = approvalFlow.steps.find(step => step.stepNumber === approvalFlow.currentStep);
                if (nextStep) {
                  await NotificationService.createApprovalStepNotification(expense, nextStep, io);
                }
              } catch (notificationError) {
                console.error('Error sending next step notification:', notificationError);
              }
            }
            
            return {
              success: true,
              status: 'approved',
              message: 'Step approved, moved to next step',
              nextStep: approvalFlow.currentStep,
              isComplete: false
            };
          } else {
            // All steps completed - approve expense
            approvalFlow.status = 'completed';
            approvalFlow.completedAt = new Date();
            approvalFlow.finalDecision = {
              status: 'approved',
              decidedBy: approver._id,
              decidedAt: new Date(),
              reason: 'Approved through hierarchical flow'
            };
            
            expense.status = 'approved';
            expense.approvedBy = approver._id;
            expense.approvedAt = new Date();
            
            await expense.save();
            await approvalFlow.save();
            
            // Send notification
            if (io) {
              try {
                await NotificationService.createExpenseApprovedNotification(expense, approver, io);
              } catch (notificationError) {
                console.error('Error sending approval notification:', notificationError);
              }
            }
            
            return {
              success: true,
              status: 'approved',
              message: 'Expense approved successfully',
              nextStep: null,
              isComplete: true
            };
          }
        }
      } else {
        // Step not completed yet - save progress
        await approvalFlow.save();
        
        return {
          success: true,
          status: 'pending',
          message: 'Approval recorded, waiting for other approvers',
          nextStep: approvalFlow.currentStep,
          isComplete: false
        };
      }
    } catch (error) {
      console.error('Error processing hierarchical approval:', error);
      throw error;
    }
  }

  /**
   * Evaluate if a step is completed based on hierarchical settings
   * @param {Object} step - Approval step object
   * @param {Object} hierarchicalSettings - Hierarchical approval settings
   * @returns {Object} Step completion result
   */
  static evaluateStepCompletion(step, hierarchicalSettings) {
    const totalApprovers = step.approvers.length;
    const requiredApprovers = step.approvers.filter(approver => approver.isRequired).length;
    const approvedCount = step.approvers.filter(approver => approver.status === 'approved').length;
    const rejectedCount = step.approvers.filter(approver => approver.status === 'rejected').length;

    // If any required approver rejected, step is rejected
    const requiredRejected = step.approvers.some(approver => 
      approver.isRequired && approver.status === 'rejected'
    );

    if (requiredRejected) {
      return {
        isCompleted: true,
        status: 'rejected',
        reason: 'Required approver rejected'
      };
    }

    // Check if all required approvers approved
    const requiredApproved = step.approvers.filter(approver => 
      approver.isRequired && approver.status === 'approved'
    ).length;

    if (hierarchicalSettings.requireAllSelected) {
      // Require all selected approvers to approve
      if (approvedCount === totalApprovers) {
        return {
          isCompleted: true,
          status: 'approved',
          reason: 'All approvers approved'
        };
      }
    } else if (hierarchicalSettings.allowPartialApproval) {
      // Allow partial approval (majority rule)
      const majorityThreshold = Math.ceil(totalApprovers / 2);
      if (approvedCount >= majorityThreshold && approvedCount > rejectedCount) {
        return {
          isCompleted: true,
          status: 'approved',
          reason: 'Majority approval achieved'
        };
      }
    } else {
      // Require all required approvers to approve
      if (requiredApproved === requiredApprovers && requiredApprovers > 0) {
        return {
          isCompleted: true,
          status: 'approved',
          reason: 'All required approvers approved'
        };
      }
    }

    // Check if all approvers have responded but no consensus
    const respondedCount = step.approvers.filter(approver => 
      approver.status !== 'pending'
    ).length;

    if (respondedCount === totalApprovers && !hierarchicalSettings.allowPartialApproval) {
      // All responded but no clear consensus - escalate or reject
      return {
        isCompleted: true,
        status: 'rejected',
        reason: 'No clear consensus from all approvers'
      };
    }

    return {
      isCompleted: false,
      status: 'pending',
      reason: 'Waiting for more approvals'
    };
  }

  /**
   * Get pending approvals for hierarchical flow
   * @param {Object} user - User object
   * @param {Object} filters - Additional filters
   * @returns {Array} Pending approvals
   */
  static async getHierarchicalPendingApprovals(user, filters = {}) {
    try {
      const query = {
        company: user.company,
        status: 'active',
        $or: [
          // User is an approver in current step
          {
            [`steps.${user.role === 'admin' ? '$' : '0'}.approvers.user`]: user._id,
            [`steps.${user.role === 'admin' ? '$' : '0'}.approvers.status`]: 'pending'
          }
        ]
      };

      // Add additional filters
      Object.assign(query, filters);

      const approvalFlows = await ApprovalFlow.find(query)
        .populate('expense')
        .populate('rule')
        .populate('steps.approvers.user', 'firstName lastName email role department')
        .sort({ startedAt: -1 });

      return approvalFlows.map(flow => ({
        ...flow.toObject(),
        currentStepData: flow.steps.find(step => step.stepNumber === flow.currentStep),
        userApprovalStatus: this.getUserApprovalStatus(flow, user._id)
      }));
    } catch (error) {
      console.error('Error getting hierarchical pending approvals:', error);
      throw error;
    }
  }

  /**
   * Get user's approval status in a flow
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {String} userId - User ID
   * @returns {Object} User approval status
   */
  static getUserApprovalStatus(approvalFlow, userId) {
    for (const step of approvalFlow.steps) {
      const userApproval = step.approvers.find(
        approver => approver.user.toString() === userId.toString()
      );
      
      if (userApproval) {
        return {
          stepNumber: step.stepNumber,
          status: userApproval.status,
          isRequired: userApproval.isRequired,
          canEscalate: userApproval.canEscalate,
          approvedAt: userApproval.approvedAt,
          rejectedAt: userApproval.rejectedAt,
          comments: userApproval.comments
        };
      }
    }
    
    return null;
  }

  /**
   * Handle escalation for hierarchical approval
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {Object} escalatedTo - User to escalate to
   * @param {Object} io - Socket.io instance
   * @returns {Object} Escalation result
   */
  static async handleHierarchicalEscalation(approvalFlow, escalatedTo, io = null) {
    try {
      approvalFlow.status = 'escalated';
      approvalFlow.escalatedAt = new Date();
      approvalFlow.escalatedTo = escalatedTo._id;
      
      await approvalFlow.save();
      
      // Send escalation notification
      if (io) {
        try {
          await NotificationService.createEscalationNotification(approvalFlow, escalatedTo, io);
        } catch (notificationError) {
          console.error('Error sending escalation notification:', notificationError);
        }
      }
      
      return {
        success: true,
        message: 'Approval escalated successfully',
        escalatedTo: escalatedTo._id
      };
    } catch (error) {
      console.error('Error handling hierarchical escalation:', error);
      throw error;
    }
  }
}

module.exports = HierarchicalApprovalEngine;
