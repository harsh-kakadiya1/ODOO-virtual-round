import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../UI/Card';
import Button from '../UI/Button';
import HierarchicalApproverSelector from './HierarchicalApproverSelector';
import { handleApiError, approvalsAPI } from '../../utils/api';

const EnhancedApprovalRuleForm = ({ 
  rule = null, 
  onSave, 
  onCancel, 
  availableUsers = [],
  availableCategories = [],
  availableDepartments = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditions: {
      amountThreshold: '',
      categories: [],
      departments: [],
      employeeIds: []
    },
    approvalSteps: [
      {
        stepNumber: 1,
        approvers: [],
        isRequired: true,
        canEscalate: false
      }
    ],
    approvalLogic: {
      type: 'hierarchical', // New type for hierarchical approval
      hierarchicalSettings: {
        requireAllSelected: true, // Require approval from all selected users
        allowPartialApproval: false, // Allow approval with partial consensus
        escalationEnabled: false,
        escalationTimeoutHours: 72,
        escalationTo: null
      },
      conditionalRules: [],
      ruleOperator: 'OR'
    },
    escalation: {
      enabled: false,
      timeoutHours: 72,
      escalateTo: null
    },
    priority: 1,
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (rule) {
      // Load existing rule data
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        conditions: {
          amountThreshold: rule.conditions?.amountThreshold?.toString() || '',
          categories: rule.conditions?.categories || [],
          departments: rule.conditions?.departments || [],
          employeeIds: rule.conditions?.employeeIds || []
        },
        approvalSteps: rule.approvalSteps?.length > 0 ? rule.approvalSteps.map(step => ({
          stepNumber: step.stepNumber,
          approvers: step.approvers?.map(approver => approver._id) || [],
          isRequired: step.isRequired,
          canEscalate: step.canEscalate
        })) : [{
          stepNumber: 1,
          approvers: [],
          isRequired: true,
          canEscalate: false
        }],
        approvalLogic: {
          type: rule.approvalLogic?.type || 'hierarchical',
          hierarchicalSettings: {
            requireAllSelected: rule.approvalLogic?.hierarchicalSettings?.requireAllSelected ?? true,
            allowPartialApproval: rule.approvalLogic?.hierarchicalSettings?.allowPartialApproval ?? false,
            escalationEnabled: rule.approvalLogic?.hierarchicalSettings?.escalationEnabled ?? false,
            escalationTimeoutHours: rule.approvalLogic?.hierarchicalSettings?.escalationTimeoutHours ?? 72,
            escalationTo: rule.approvalLogic?.hierarchicalSettings?.escalationTo || null
          },
          conditionalRules: rule.approvalLogic?.conditionalRules || [],
          ruleOperator: rule.approvalLogic?.ruleOperator || 'OR'
        },
        escalation: {
          enabled: rule.escalation?.enabled || false,
          timeoutHours: rule.escalation?.timeoutHours || 72,
          escalateTo: rule.escalation?.escalateTo || null
        },
        priority: rule.priority || 1,
        isActive: rule.isActive ?? true
      });
    }
  }, [rule]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Rule name is required';
    }

    if (formData.approvalSteps.length === 0) {
      errors.approvalSteps = 'At least one approval step is required';
    }

    formData.approvalSteps.forEach((step, index) => {
      if (step.approvers.length === 0) {
        errors[`step_${index}_approvers`] = 'At least one approver is required for each step';
      }
    });

    if (formData.conditions.amountThreshold && isNaN(parseFloat(formData.conditions.amountThreshold))) {
      errors.amountThreshold = 'Amount threshold must be a valid number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    try {
      const ruleData = {
        ...formData,
        conditions: {
          ...formData.conditions,
          amountThreshold: formData.conditions.amountThreshold ? 
            parseFloat(formData.conditions.amountThreshold) : undefined
        }
      };

      if (rule) {
        await approvalsAPI.updateApprovalRule(rule._id, ruleData);
        toast.success('Approval rule updated successfully');
      } else {
        await approvalsAPI.createApprovalRule(ruleData);
        toast.success('Approval rule created successfully');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving approval rule:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedFormData = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const addApprovalStep = () => {
    setFormData(prev => ({
      ...prev,
      approvalSteps: [
        ...prev.approvalSteps,
        {
          stepNumber: prev.approvalSteps.length + 1,
          approvers: [],
          isRequired: true,
          canEscalate: false
        }
      ]
    }));
  };

  const removeApprovalStep = (stepIndex) => {
    if (formData.approvalSteps.length <= 1) {
      toast.error('At least one approval step is required');
      return;
    }

    const newSteps = formData.approvalSteps.filter((_, index) => index !== stepIndex);
    const renumberedSteps = newSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));

    setFormData(prev => ({
      ...prev,
      approvalSteps: renumberedSteps
    }));
  };

  const updateApprovalStep = (stepIndex, field, value) => {
    const newSteps = [...formData.approvalSteps];
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      approvalSteps: newSteps
    }));
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {rule ? 'Edit Approval Rule' : 'Create New Approval Rule'}
          </h2>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => updateFormData('priority', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>High (1)</option>
                <option value={2}>Medium (2)</option>
                <option value={3}>Low (3)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Threshold ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.conditions.amountThreshold}
                onChange={(e) => updateNestedFormData('conditions', 'amountThreshold', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.amountThreshold ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Leave empty for no threshold"
              />
              {validationErrors.amountThreshold && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.amountThreshold}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories (Optional)
              </label>
              <select
                multiple
                value={formData.conditions.categories}
                onChange={(e) => updateNestedFormData('conditions', 'categories', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
              >
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple categories</p>
            </div>
          </div>

          {/* Approval Logic Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Logic Type
            </label>
            <select
              value={formData.approvalLogic.type}
              onChange={(e) => updateNestedFormData('approvalLogic', 'type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hierarchical">Hierarchical (Recommended)</option>
              <option value="sequential">Sequential (Step by Step)</option>
              <option value="percentage">Percentage Based</option>
              <option value="specific_approver">Specific Approver</option>
              <option value="hybrid">Hybrid (Multiple + Conditional)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {formData.approvalLogic.type === 'hierarchical' && 'Select approvers hierarchically with mandatory approval requirements'}
              {formData.approvalLogic.type === 'sequential' && 'Approvers must approve in order'}
              {formData.approvalLogic.type === 'percentage' && 'Require a percentage of approvers to approve'}
              {formData.approvalLogic.type === 'specific_approver' && 'Auto-approve when specific person approves'}
              {formData.approvalLogic.type === 'hybrid' && 'Combine multiple approvers with conditional rules'}
            </p>
          </div>

          {/* Hierarchical Settings */}
          {formData.approvalLogic.type === 'hierarchical' && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Hierarchical Approval Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.approvalLogic.hierarchicalSettings.requireAllSelected}
                      onChange={(e) => updateNestedFormData('approvalLogic', 'hierarchicalSettings', {
                        ...formData.approvalLogic.hierarchicalSettings,
                        requireAllSelected: e.target.checked
                      })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Require All Selected Approvers</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">All selected approvers must approve</p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.approvalLogic.hierarchicalSettings.allowPartialApproval}
                      onChange={(e) => updateNestedFormData('approvalLogic', 'hierarchicalSettings', {
                        ...formData.approvalLogic.hierarchicalSettings,
                        allowPartialApproval: e.target.checked
                      })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Allow Partial Approval</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Allow approval with majority consensus</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.approvalLogic.hierarchicalSettings.escalationEnabled}
                    onChange={(e) => updateNestedFormData('approvalLogic', 'hierarchicalSettings', {
                      ...formData.approvalLogic.hierarchicalSettings,
                      escalationEnabled: e.target.checked
                    })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Escalation</span>
                </label>
                
                {formData.approvalLogic.hierarchicalSettings.escalationEnabled && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Escalation Timeout (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.approvalLogic.hierarchicalSettings.escalationTimeoutHours}
                        onChange={(e) => updateNestedFormData('approvalLogic', 'hierarchicalSettings', {
                          ...formData.approvalLogic.hierarchicalSettings,
                          escalationTimeoutHours: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Escalate To
                      </label>
                      <select
                        value={formData.approvalLogic.hierarchicalSettings.escalationTo || ''}
                        onChange={(e) => updateNestedFormData('approvalLogic', 'hierarchicalSettings', {
                          ...formData.approvalLogic.hierarchicalSettings,
                          escalationTo: e.target.value || null
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select user to escalate to</option>
                        {availableUsers.filter(user => ['admin', 'manager'].includes(user.role)).map(user => (
                          <option key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Steps */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Approval Steps</h3>
              <Button type="button" variant="secondary" onClick={addApprovalStep}>
                Add Step
              </Button>
            </div>

            {formData.approvalSteps.map((step, stepIndex) => (
              <div key={stepIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Step {step.stepNumber}</h4>
                  {formData.approvalSteps.length > 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeApprovalStep(stepIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Hierarchical Approver Selector */}
                  {formData.approvalLogic.type === 'hierarchical' ? (
                    availableUsers.length === 0 ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          No approvers available. Please ensure there are users with admin or manager roles in your company.
                        </p>
                      </div>
                    ) : (
                      <HierarchicalApproverSelector
                        availableUsers={availableUsers}
                        selectedApprovers={step.approvers}
                        onChange={(selectedApprovers) => updateApprovalStep(stepIndex, 'approvers', selectedApprovers)}
                      />
                    )
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Approvers *
                        </label>
                        <select
                          multiple
                          value={step.approvers}
                          onChange={(e) => {
                            const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                            updateApprovalStep(stepIndex, 'approvers', selectedValues);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 ${
                            validationErrors[`step_${stepIndex}_approvers`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        >
                          {availableUsers.filter(user => ['admin', 'manager'].includes(user.role)).map(approver => (
                            <option key={approver._id} value={approver._id}>
                              {approver.firstName} {approver.lastName} ({approver.role})
                            </option>
                          ))}
                        </select>
                        {validationErrors[`step_${stepIndex}_approvers`] && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors[`step_${stepIndex}_approvers`]}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple approvers</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={step.isRequired}
                          onChange={(e) => updateApprovalStep(stepIndex, 'isRequired', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Required Step</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={step.canEscalate}
                          onChange={(e) => updateApprovalStep(stepIndex, 'canEscalate', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Can Escalate</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateFormData('isActive', e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Active Rule</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (rule ? 'Update Rule' : 'Create Rule')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default EnhancedApprovalRuleForm;
