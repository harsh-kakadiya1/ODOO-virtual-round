import React, { useState } from 'react';
import { Plus, Trash2, Settings, Users, DollarSign, Tag, Building } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';

const ConditionalRuleBuilder = ({ rules = [], onChange, availableApprovers = [], availableCategories = [], availableDepartments = [] }) => {
  const [localRules, setLocalRules] = useState(rules);

  const ruleTypes = [
    {
      value: 'percentage',
      label: 'Percentage Rule',
      icon: Settings,
      description: 'Trigger when a percentage of approvers approve'
    },
    {
      value: 'specific_approver',
      label: 'Specific Approver',
      icon: Users,
      description: 'Trigger when a specific person approves'
    },
    {
      value: 'amount_threshold',
      label: 'Amount Threshold',
      icon: DollarSign,
      description: 'Trigger based on expense amount'
    },
    {
      value: 'category',
      label: 'Category',
      icon: Tag,
      description: 'Trigger for specific expense categories'
    },
    {
      value: 'department',
      label: 'Department',
      icon: Building,
      description: 'Trigger for specific departments'
    }
  ];

  const actions = [
    { value: 'auto_approve', label: 'Auto Approve', color: 'text-green-600' },
    { value: 'auto_reject', label: 'Auto Reject', color: 'text-red-600' },
    { value: 'skip_step', label: 'Skip Step', color: 'text-yellow-600' },
    { value: 'require_additional', label: 'Require Additional Approvers', color: 'text-blue-600' }
  ];

  const addRule = () => {
    const newRule = {
      ruleType: 'percentage',
      condition: {},
      action: 'auto_approve',
      additionalApprovers: []
    };
    const updatedRules = [...localRules, newRule];
    setLocalRules(updatedRules);
    onChange(updatedRules);
  };

  const removeRule = (index) => {
    const updatedRules = localRules.filter((_, i) => i !== index);
    setLocalRules(updatedRules);
    onChange(updatedRules);
  };

  const updateRule = (index, field, value) => {
    const updatedRules = [...localRules];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedRules[index][parent] = {
        ...updatedRules[index][parent],
        [child]: value
      };
    } else {
      updatedRules[index][field] = value;
    }
    setLocalRules(updatedRules);
    onChange(updatedRules);
  };

  const updateCondition = (index, conditionType, value) => {
    const updatedRules = [...localRules];
    updatedRules[index].condition = {
      ...updatedRules[index].condition,
      [conditionType]: value
    };
    setLocalRules(updatedRules);
    onChange(updatedRules);
  };

  const renderConditionInput = (rule, index) => {
    const { ruleType, condition } = rule;

    switch (ruleType) {
      case 'percentage':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={condition.percentage || ''}
              onChange={(e) => updateCondition(index, 'percentage', parseInt(e.target.value))}
              placeholder="60"
              className="w-20"
            />
            <span className="text-sm text-gray-600">% of approvers</span>
          </div>
        );

      case 'specific_approver':
        return (
          <select
            value={condition.approverId || ''}
            onChange={(e) => updateCondition(index, 'approverId', e.target.value)}
            className="input"
          >
            <option value="">Select approver</option>
            {availableApprovers.map(approver => (
              <option key={approver._id} value={approver._id}>
                {approver.firstName} {approver.lastName} ({approver.role})
              </option>
            ))}
          </select>
        );

      case 'amount_threshold':
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={condition.amountThreshold || ''}
              onChange={(e) => updateCondition(index, 'amountThreshold', parseFloat(e.target.value))}
              placeholder="1000.00"
              className="w-32"
            />
          </div>
        );

      case 'category':
        return (
          <select
            value={condition.category || ''}
            onChange={(e) => updateCondition(index, 'category', e.target.value)}
            className="input"
          >
            <option value="">Select category</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        );

      case 'department':
        return (
          <select
            value={condition.department || ''}
            onChange={(e) => updateCondition(index, 'department', e.target.value)}
            className="input"
          >
            <option value="">Select department</option>
            {availableDepartments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Conditional Rules</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {localRules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No conditional rules configured</p>
          <p className="text-sm">Add rules to create automatic approval conditions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localRules.map((rule, index) => {
            const ruleTypeConfig = ruleTypes.find(rt => rt.value === rule.ruleType);
            const Icon = ruleTypeConfig?.icon || Settings;
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {ruleTypeConfig?.label || 'Unknown Rule'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {ruleTypeConfig?.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRule(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Rule Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Type
                    </label>
                    <select
                      value={rule.ruleType}
                      onChange={(e) => updateRule(index, 'ruleType', e.target.value)}
                      className="input"
                    >
                      {ruleTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    {renderConditionInput(rule, index)}
                  </div>

                  {/* Action */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <select
                      value={rule.action}
                      onChange={(e) => updateRule(index, 'action', e.target.value)}
                      className="input"
                    >
                      {actions.map(action => (
                        <option key={action.value} value={action.value}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Approvers (if action is require_additional) */}
                {rule.action === 'require_additional' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Approvers
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableApprovers.map(approver => (
                        <label key={approver._id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={rule.additionalApprovers?.includes(approver._id) || false}
                            onChange={(e) => {
                              const currentApprovers = rule.additionalApprovers || [];
                              const updatedApprovers = e.target.checked
                                ? [...currentApprovers, approver._id]
                                : currentApprovers.filter(id => id !== approver._id);
                              updateRule(index, 'additionalApprovers', updatedApprovers);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {approver.firstName} {approver.lastName} ({approver.role})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rule Operator */}
      {localRules.length > 1 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rule Combination Logic
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="ruleOperator"
                value="OR"
                checked={true} // Default to OR
                onChange={(e) => onChange(localRules, e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                OR - Trigger if ANY rule matches
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="ruleOperator"
                value="AND"
                onChange={(e) => onChange(localRules, e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                AND - Trigger if ALL rules match
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionalRuleBuilder;
