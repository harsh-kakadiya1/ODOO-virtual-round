    import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';
import { handleApiError, approvalsAPI } from '../../utils/api';
import ConditionalRuleBuilder from '../../components/ApprovalRules/ConditionalRuleBuilder';
import EnhancedApprovalRuleForm from '../../components/ApprovalRules/EnhancedApprovalRuleForm';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [availableApprovers, setAvailableApprovers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditions: {
      amountThreshold: '',
      categories: [],
      employeeIds: []
    },
    approvalSteps: [
      {
        stepNumber: 1,
        approvers: [],
        isRequired: true
      }
    ],
    approvalLogic: {
      type: 'sequential',
      conditionalRules: [],
      ruleOperator: 'OR'
    },
    priority: 1,
    isActive: true
  });

  useEffect(() => {
    loadRules();
    loadAvailableApprovers();
  }, []);

  const loadRules = async () => {
    try {
      const response = await approvalsAPI.getApprovalRules();
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Error loading approval rules:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableApprovers = async () => {
    try {
      const response = await approvalsAPI.getAvailableApprovers();
      console.log('Available approvers response:', response.data);
      setAvailableApprovers(response.data.data || []);
    } catch (error) {
      console.error('Error loading available approvers:', error);
      toast.error('Failed to load available approvers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const ruleData = {
        ...formData,
        conditions: {
          ...formData.conditions,
          amountThreshold: formData.conditions.amountThreshold ? 
            parseFloat(formData.conditions.amountThreshold) : undefined
        }
      };

      if (editingRule) {
        await approvalsAPI.updateApprovalRule(editingRule._id, ruleData);
        toast.success('Approval rule updated successfully');
      } else {
        await approvalsAPI.createApprovalRule(ruleData);
        toast.success('Approval rule created successfully');
      }
      
      resetForm();
      loadRules();
    } catch (error) {
      console.error('Error saving approval rule:', error);
      toast.error(handleApiError(error));
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      conditions: {
        amountThreshold: rule.conditions?.amountThreshold?.toString() || '',
        categories: rule.conditions?.categories || [],
        employeeIds: rule.conditions?.employeeIds || []
      },
      approvalSteps: rule.approvalSteps.map(step => ({
        stepNumber: step.stepNumber,
        approvers: step.approvers.map(approver => approver._id),
        isRequired: step.isRequired
      })),
      priority: rule.priority,
      isActive: rule.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this approval rule?')) {
      return;
    }

    try {
      await approvalsAPI.deleteApprovalRule(ruleId);
      toast.success('Approval rule deleted successfully');
      loadRules();
    } catch (error) {
      console.error('Error deleting approval rule:', error);
      toast.error(handleApiError(error));
    }
  };

  const handleToggleStatus = async (ruleId) => {
    try {
      const response = await approvalsAPI.toggleApprovalRule(ruleId);
      toast.success(response.data.message);
      loadRules();
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast.error(handleApiError(error));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      conditions: {
        amountThreshold: '',
        categories: [],
        employeeIds: []
      },
      approvalSteps: [
        {
          stepNumber: 1,
          approvers: [],
          isRequired: true
        }
      ],
      priority: 1,
      isActive: true
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const addApprovalStep = () => {
    setFormData({
      ...formData,
      approvalSteps: [
        ...formData.approvalSteps,
        {
          stepNumber: formData.approvalSteps.length + 1,
          approvers: [],
          isRequired: true
        }
      ]
    });
  };

  const removeApprovalStep = (stepIndex) => {
    if (formData.approvalSteps.length <= 1) {
      toast.error('At least one approval step is required');
      return;
    }

    const newSteps = formData.approvalSteps.filter((_, index) => index !== stepIndex);
    // Renumber steps
    const renumberedSteps = newSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));

    setFormData({
      ...formData,
      approvalSteps: renumberedSteps
    });
  };

  const updateApprovalStep = (stepIndex, field, value) => {
    const newSteps = [...formData.approvalSteps];
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      [field]: value
    };
    setFormData({
      ...formData,
      approvalSteps: newSteps
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Approval Rules</h1>
        <Button onClick={() => setShowForm(true)}>
          Add New Rule
        </Button>
      </div>

      {showForm && (
        <EnhancedApprovalRuleForm
          rule={editingRule}
          onSave={() => {
            resetForm();
            loadRules();
          }}
          onCancel={resetForm}
          availableUsers={availableApprovers}
          availableCategories={['Travel', 'Meals', 'Office Supplies', 'Transportation', 'Accommodation', 'Other']}
          availableDepartments={['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']}
        />
      )}

      {/* Rules List */}
      <div className="grid gap-6">
        {rules.length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <p className="text-gray-500">No approval rules found. Create your first rule to get started.</p>
            </div>
          </Card>
        ) : (
          rules.map(rule => (
            <Card key={rule._id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{rule.name}</h3>
                    {rule.description && (
                      <p className="text-gray-600 mt-1">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={rule.isActive ? 'success' : 'danger'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="info">Priority {rule.priority}</Badge>
                  </div>
                </div>

                {/* Conditions */}
                {(rule.conditions?.amountThreshold) && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Conditions:</h4>
                    <div className="text-sm text-gray-600">
                      {rule.conditions.amountThreshold && (
                        <p>Amount threshold: ${rule.conditions.amountThreshold}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Approval Steps */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Approval Steps:</h4>
                  <div className="space-y-2">
                    {rule.approvalSteps.map((step, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="font-medium mr-2">Step {step.stepNumber}:</span>
                        <span className="text-gray-600">
                          {step.approvers?.map(approver => `${approver.firstName} ${approver.lastName}`).join(', ')}
                        </span>
                        {step.isRequired && (
                          <Badge variant="warning" className="ml-2">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleStatus(rule._id)}
                  >
                    {rule.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(rule._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalRules;