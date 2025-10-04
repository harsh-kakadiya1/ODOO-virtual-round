const ApprovalFlow = require('../models/ApprovalFlow');
const Expense = require('../models/Expense');
const User = require('../models/User');
const NotificationService = require('./notificationService');

class ConditionalApprovalEngine {
  /**
   * Evaluate conditional approval rules for an expense
   * @param {Object} expense - Expense object
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {Object} rule - ApprovalRule object
   * @returns {Object} Evaluation result
   */
  static async evaluateConditionalRules(expense, approvalFlow, rule) {
    try {
      const results = {
        shouldAutoApprove: false,
        shouldAutoReject: false,
        shouldSkipStep: false,
        requiresAdditionalApprovers: false,
        additionalApprovers: [],
        triggeredRules: [],
        reason: ''
      };

      if (!rule.approvalLogic.conditionalRules || rule.approvalLogic.conditionalRules.length === 0) {
        return results;
      }

      const ruleResults = [];
      
      for (const conditionalRule of rule.approvalLogic.conditionalRules) {
        const ruleResult = await this.evaluateSingleRule(expense, approvalFlow, conditionalRule);
        ruleResults.push(ruleResult);
        
        if (ruleResult.triggered) {
          results.triggeredRules.push(conditionalRule);
        }
      }

      // Apply logic operator (AND/OR)
      const shouldTrigger = rule.approvalLogic.ruleOperator === 'AND' 
        ? ruleResults.every(r => r.triggered)
        : ruleResults.some(r => r.triggered);

      if (shouldTrigger) {
        // Determine the action based on triggered rules
        const triggeredActions = ruleResults
          .filter(r => r.triggered)
          .map(r => r.action);

        // Priority: auto_approve > auto_reject > require_additional > skip_step
        if (triggeredActions.includes('auto_approve')) {
          results.shouldAutoApprove = true;
          results.reason = 'Auto-approved based on conditional rule';
        } else if (triggeredActions.includes('auto_reject')) {
          results.shouldAutoReject = true;
          results.reason = 'Auto-rejected based on conditional rule';
        } else if (triggeredActions.includes('require_additional')) {
          results.requiresAdditionalApprovers = true;
          // Collect all additional approvers from triggered rules
          const additionalApprovers = ruleResults
            .filter(r => r.triggered && r.additionalApprovers)
            .flatMap(r => r.additionalApprovers);
          results.additionalApprovers = [...new Set(additionalApprovers.map(a => a.toString()))];
        } else if (triggeredActions.includes('skip_step')) {
          results.shouldSkipStep = true;
          results.reason = 'Step skipped based on conditional rule';
        }
      }

      return results;
    } catch (error) {
      console.error('Error evaluating conditional rules:', error);
      return {
        shouldAutoApprove: false,
        shouldAutoReject: false,
        shouldSkipStep: false,
        requiresAdditionalApprovers: false,
        additionalApprovers: [],
        triggeredRules: [],
        reason: 'Error evaluating rules'
      };
    }
  }

  /**
   * Evaluate a single conditional rule
   * @param {Object} expense - Expense object
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {Object} rule - Single conditional rule
   * @returns {Object} Rule evaluation result
   */
  static async evaluateSingleRule(expense, approvalFlow, rule) {
    const result = {
      triggered: false,
      action: rule.action,
      additionalApprovers: rule.additionalApprovers || []
    };

    try {
      switch (rule.ruleType) {
        case 'percentage':
          result.triggered = await this.evaluatePercentageRule(expense, approvalFlow, rule);
          break;
        
        case 'specific_approver':
          result.triggered = await this.evaluateSpecificApproverRule(expense, approvalFlow, rule);
          break;
        
        case 'amount_threshold':
          result.triggered = this.evaluateAmountThresholdRule(expense, rule);
          break;
        
        case 'category':
          result.triggered = this.evaluateCategoryRule(expense, rule);
          break;
        
        case 'department':
          result.triggered = await this.evaluateDepartmentRule(expense, rule);
          break;
        
        default:
          console.warn(`Unknown rule type: ${rule.ruleType}`);
      }
    } catch (error) {
      console.error(`Error evaluating rule type ${rule.ruleType}:`, error);
    }

    return result;
  }

  /**
   * Evaluate percentage-based approval rule
   * @param {Object} expense - Expense object
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {Object} rule - Percentage rule
   * @returns {boolean} Whether rule is triggered
   */
  static async evaluatePercentageRule(expense, approvalFlow, rule) {
    if (!rule.condition.percentage) return false;

    const currentStep = approvalFlow.steps.find(step => step.stepNumber === approvalFlow.currentStep);
    if (!currentStep) return false;

    const totalApprovers = currentStep.approvers.length;
    const approvedCount = currentStep.approvers.filter(approver => approver.status === 'approved').length;
    const requiredCount = Math.ceil((rule.condition.percentage / 100) * totalApprovers);

    return approvedCount >= requiredCount;
  }

  /**
   * Evaluate specific approver rule
   * @param {Object} expense - Expense object
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {Object} rule - Specific approver rule
   * @returns {boolean} Whether rule is triggered
   */
  static async evaluateSpecificApproverRule(expense, approvalFlow, rule) {
    if (!rule.condition.approverId) return false;

    const currentStep = approvalFlow.steps.find(step => step.stepNumber === approvalFlow.currentStep);
    if (!currentStep) return false;

    const specificApprover = currentStep.approvers.find(
      approver => approver.user.toString() === rule.condition.approverId.toString()
    );

    return specificApprover && specificApprover.status === 'approved';
  }

  /**
   * Evaluate amount threshold rule
   * @param {Object} expense - Expense object
   * @param {Object} rule - Amount threshold rule
   * @returns {boolean} Whether rule is triggered
   */
  static evaluateAmountThresholdRule(expense, rule) {
    if (!rule.condition.amountThreshold) return false;
    return expense.amountInCompanyCurrency >= rule.condition.amountThreshold;
  }

  /**
   * Evaluate category rule
   * @param {Object} expense - Expense object
   * @param {Object} rule - Category rule
   * @returns {boolean} Whether rule is triggered
   */
  static evaluateCategoryRule(expense, rule) {
    if (!rule.condition.category) return false;
    return expense.category.toLowerCase() === rule.condition.category.toLowerCase();
  }

  /**
   * Evaluate department rule
   * @param {Object} expense - Expense object
   * @param {Object} rule - Department rule
   * @returns {boolean} Whether rule is triggered
   */
  static async evaluateDepartmentRule(expense, rule) {
    if (!rule.condition.department) return false;

    const employee = await User.findById(expense.employee).populate('department');
    if (!employee || !employee.department) return false;

    return employee.department.toLowerCase() === rule.condition.department.toLowerCase();
  }

  /**
   * Process conditional approval for an expense
   * @param {Object} expense - Expense object
   * @param {Object} approvalFlow - ApprovalFlow object
   * @param {Object} rule - ApprovalRule object
   * @param {Object} io - Socket.IO instance
   * @returns {Object} Processing result
   */
  static async processConditionalApproval(expense, approvalFlow, rule, io = null) {
    try {
      const evaluation = await this.evaluateConditionalRules(expense, approvalFlow, rule);
      
      if (evaluation.shouldAutoApprove) {
        // Auto-approve the expense
        expense.status = 'approved';
        expense.approvedBy = null; // System approval
        expense.approvedAt = new Date();
        
        approvalFlow.status = 'completed';
        approvalFlow.completedAt = new Date();
        approvalFlow.completionReason = evaluation.reason;
        
        await Promise.all([expense.save(), approvalFlow.save()]);
        
        // Send notification
        if (io) {
          await NotificationService.createExpenseApprovedNotification(
            expense, 
            { firstName: 'System', lastName: 'Auto-Approval' }, 
            io
          );
        }
        
        return { success: true, action: 'auto_approved', reason: evaluation.reason };
      }
      
      if (evaluation.shouldAutoReject) {
        // Auto-reject the expense
        expense.status = 'rejected';
        expense.rejectedBy = null; // System rejection
        expense.rejectedAt = new Date();
        expense.rejectionReason = evaluation.reason;
        
        approvalFlow.status = 'rejected';
        approvalFlow.completedAt = new Date();
        approvalFlow.completionReason = evaluation.reason;
        
        await Promise.all([expense.save(), approvalFlow.save()]);
        
        // Send notification
        if (io) {
          await NotificationService.createExpenseRejectedNotification(
            expense, 
            { firstName: 'System', lastName: 'Auto-Rejection' }, 
            evaluation.reason, 
            io
          );
        }
        
        return { success: true, action: 'auto_rejected', reason: evaluation.reason };
      }
      
      if (evaluation.shouldSkipStep) {
        // Skip current step and move to next
        if (approvalFlow.currentStep < approvalFlow.totalSteps) {
          approvalFlow.currentStep += 1;
          await approvalFlow.save();
          
          return { success: true, action: 'step_skipped', reason: evaluation.reason };
        }
      }
      
      if (evaluation.requiresAdditionalApprovers && evaluation.additionalApprovers.length > 0) {
        // Add additional approvers to current step
        const currentStep = approvalFlow.steps.find(step => step.stepNumber === approvalFlow.currentStep);
        if (currentStep) {
          const additionalApprovers = await User.find({
            _id: { $in: evaluation.additionalApprovers },
            company: expense.company
          });
          
          for (const approver of additionalApprovers) {
            // Check if approver is not already in the step
            const existingApprover = currentStep.approvers.find(
              a => a.user.toString() === approver._id.toString()
            );
            
            if (!existingApprover) {
              currentStep.approvers.push({
                user: approver._id,
                status: 'pending',
                assignedAt: new Date()
              });
            }
          }
          
          await approvalFlow.save();
          
          return { 
            success: true, 
            action: 'additional_approvers_added', 
            reason: `Added ${additionalApprovers.length} additional approvers`,
            additionalApprovers: additionalApprovers.length
          };
        }
      }
      
      return { success: false, action: 'no_action', reason: 'No conditional rules triggered' };
    } catch (error) {
      console.error('Error processing conditional approval:', error);
      return { success: false, action: 'error', reason: 'Error processing conditional approval' };
    }
  }
}

module.exports = ConditionalApprovalEngine;
