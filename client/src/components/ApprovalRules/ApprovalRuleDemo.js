import React, { useState } from 'react';
import { Card } from '../UI/Card';
import Button from '../UI/Button';
import HierarchicalApproverSelector from './HierarchicalApproverSelector';

const ApprovalRuleDemo = () => {
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [showDemo, setShowDemo] = useState(false);

  // Mock data for demonstration
  const mockUsers = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Admin',
      email: 'john.admin@company.com',
      role: 'admin',
      department: { name: 'Executive' }
    },
    {
      _id: '2',
      firstName: 'Sarah',
      lastName: 'Manager',
      email: 'sarah.manager@company.com',
      role: 'manager',
      department: { name: 'Engineering' }
    },
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'TechLead',
      email: 'mike.techlead@company.com',
      role: 'manager',
      department: { name: 'Engineering' }
    },
    {
      _id: '4',
      firstName: 'Lisa',
      lastName: 'SalesManager',
      email: 'lisa.sales@company.com',
      role: 'manager',
      department: { name: 'Sales' }
    },
    {
      _id: '5',
      firstName: 'Tom',
      lastName: 'Employee',
      email: 'tom.employee@company.com',
      role: 'employee',
      department: { name: 'Engineering' }
    }
  ];

  const handleApproverChange = (approvers) => {
    setSelectedApprovers(approvers);
    console.log('Selected approvers:', approvers);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Hierarchical Approval Rules Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This demo shows how the hierarchical approval system works with checkboxes for selecting approvers.
        </p>
        
        <Button onClick={() => setShowDemo(!showDemo)}>
          {showDemo ? 'Hide Demo' : 'Show Demo'}
        </Button>
      </div>

      {showDemo && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Demo: Hierarchical Approver Selection</h3>
            <p className="text-sm text-gray-600 mb-6">
              Select approvers hierarchically. The system supports:
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li><strong>All Admins:</strong> Select all administrators at once</li>
              <li><strong>All Managers:</strong> Select all managers across departments</li>
              <li><strong>Department Managers:</strong> Select managers by department</li>
              <li><strong>Individual Users:</strong> Select specific employees</li>
              <li><strong>Mandatory Approval:</strong> Selected users must approve expenses</li>
              <li><strong>Hierarchy Maintenance:</strong> Respects organizational structure</li>
            </ul>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Current Selection:</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                {selectedApprovers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No approvers selected</p>
                ) : (
                  <div className="space-y-1">
                    {selectedApprovers.map(userId => {
                      const user = mockUsers.find(u => u._id === userId);
                      return user ? (
                        <div key={userId} className="text-sm">
                          <span className="font-medium">{user.firstName} {user.lastName}</span>
                          <span className="text-gray-500 ml-2">({user.role})</span>
                          {user.department && (
                            <span className="text-gray-400 ml-2">- {user.department.name}</span>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <HierarchicalApproverSelector
              availableUsers={mockUsers}
              selectedApprovers={selectedApprovers}
              onChange={handleApproverChange}
            />

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How It Works:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Hierarchical Selection:</strong> Use checkboxes to select approvers at different levels</p>
                <p>• <strong>Mandatory Approval:</strong> All selected approvers must approve the expense</p>
                <p>• <strong>Company Hierarchy:</strong> Respects admin → manager → employee structure</p>
                <p>• <strong>Department Organization:</strong> Managers grouped by department for easy selection</p>
                <p>• <strong>Flexible Configuration:</strong> Support for partial approval and escalation</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ApprovalRuleDemo;
