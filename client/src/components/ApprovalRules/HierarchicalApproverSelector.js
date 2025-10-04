import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, UserIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';

const HierarchicalApproverSelector = ({ 
  availableUsers = [], 
  selectedApprovers = [], 
  onChange, 
  companyHierarchy = {},
  disabled = false 
}) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const [checkedUsers, setCheckedUsers] = useState(new Set(selectedApprovers));

  useEffect(() => {
    setCheckedUsers(new Set(selectedApprovers));
    console.log('HierarchicalApproverSelector - availableUsers:', availableUsers);
    console.log('HierarchicalApproverSelector - selectedApprovers:', selectedApprovers);
  }, [selectedApprovers, availableUsers]);

  // Organize users by role and hierarchy
  const organizedUsers = {
    admins: availableUsers.filter(user => user.role === 'admin'),
    managers: availableUsers.filter(user => user.role === 'manager'),
    employees: availableUsers.filter(user => user.role === 'employee')
  };

  // Get managers grouped by department if available
  const managersByDepartment = organizedUsers.managers.reduce((acc, manager) => {
    const dept = manager.department?.name || manager.department || 'No Department';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(manager);
    return acc;
  }, {});

  const toggleExpanded = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleCheckboxChange = (userId, isChecked, isHierarchical = false) => {
    const newCheckedUsers = new Set(checkedUsers);
    
    if (isHierarchical) {
      // Handle hierarchical selection (Admin, All Managers, etc.)
      if (userId === 'all-admins') {
        if (isChecked) {
          organizedUsers.admins.forEach(admin => newCheckedUsers.add(admin._id));
        } else {
          organizedUsers.admins.forEach(admin => newCheckedUsers.delete(admin._id));
        }
      } else if (userId === 'all-managers') {
        if (isChecked) {
          organizedUsers.managers.forEach(manager => newCheckedUsers.add(manager._id));
        } else {
          organizedUsers.managers.forEach(manager => newCheckedUsers.delete(manager._id));
        }
      } else if (userId.startsWith('dept-')) {
        const deptName = userId.replace('dept-', '');
        const deptManagers = managersByDepartment[deptName] || [];
        if (isChecked) {
          deptManagers.forEach(manager => newCheckedUsers.add(manager._id));
        } else {
          deptManagers.forEach(manager => newCheckedUsers.delete(manager._id));
        }
      }
    } else {
      // Handle individual user selection
      if (isChecked) {
        newCheckedUsers.add(userId);
      } else {
        newCheckedUsers.delete(userId);
      }
    }

    setCheckedUsers(newCheckedUsers);
    onChange(Array.from(newCheckedUsers));
  };

  const isHierarchicalChecked = (userId) => {
    if (userId === 'all-admins') {
      return organizedUsers.admins.length > 0 && 
             organizedUsers.admins.every(admin => checkedUsers.has(admin._id));
    } else if (userId === 'all-managers') {
      return organizedUsers.managers.length > 0 && 
             organizedUsers.managers.every(manager => checkedUsers.has(manager._id));
    } else if (userId.startsWith('dept-')) {
      const deptName = userId.replace('dept-', '');
      const deptManagers = managersByDepartment[deptName] || [];
      return deptManagers.length > 0 && 
             deptManagers.every(manager => checkedUsers.has(manager._id));
    }
    return false;
  };

  const isHierarchicalIndeterminate = (userId) => {
    if (userId === 'all-admins') {
      const adminIds = organizedUsers.admins.map(admin => admin._id);
      const checkedAdmins = adminIds.filter(id => checkedUsers.has(id));
      return checkedAdmins.length > 0 && checkedAdmins.length < adminIds.length;
    } else if (userId === 'all-managers') {
      const managerIds = organizedUsers.managers.map(manager => manager._id);
      const checkedManagers = managerIds.filter(id => checkedUsers.has(id));
      return checkedManagers.length > 0 && checkedManagers.length < managerIds.length;
    } else if (userId.startsWith('dept-')) {
      const deptName = userId.replace('dept-', '');
      const deptManagers = managersByDepartment[deptName] || [];
      const deptManagerIds = deptManagers.map(manager => manager._id);
      const checkedDeptManagers = deptManagerIds.filter(id => checkedUsers.has(id));
      return checkedDeptManagers.length > 0 && checkedDeptManagers.length < deptManagerIds.length;
    }
    return false;
  };

  const renderHierarchicalNode = (nodeId, label, icon, children = null, isIndented = false) => {
    const isExpanded = expandedNodes[nodeId];
    const isChecked = isHierarchicalChecked(nodeId);
    const isIndeterminate = isHierarchicalIndeterminate(nodeId);

    return (
      <div key={nodeId} className={`${isIndented ? 'ml-6' : ''}`}>
        <div className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-md">
          <button
            type="button"
            onClick={() => toggleExpanded(nodeId)}
            className="mr-2 p-1 hover:bg-gray-200 rounded"
            disabled={disabled}
          >
            {children ? (
              isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          <input
            type="checkbox"
            id={nodeId}
            checked={isChecked}
            ref={input => {
              if (input) {
                input.indeterminate = isIndeterminate;
              }
            }}
            onChange={(e) => handleCheckboxChange(nodeId, e.target.checked, true)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={disabled}
          />

          <div className="flex items-center flex-1">
            {icon}
            <label htmlFor={nodeId} className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
              {label}
            </label>
          </div>
        </div>

        {children && isExpanded && (
          <div className="ml-6">
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderUserNode = (user) => {
    const isChecked = checkedUsers.has(user._id);
    
    return (
      <div key={user._id} className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-md ml-6">
        <input
          type="checkbox"
          id={`user-${user._id}`}
          checked={isChecked}
          onChange={(e) => handleCheckboxChange(user._id, e.target.checked)}
          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={disabled}
        />

        <div className="flex items-center flex-1">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <label htmlFor={`user-${user._id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
            <span className="font-medium">{user.firstName} {user.lastName}</span>
            <span className="text-gray-500 ml-2">({user.email})</span>
            {(user.department?.name || user.department) && (
              <span className="text-xs text-gray-400 ml-2">- {user.department?.name || user.department}</span>
            )}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Select Approvers</h4>
        <p className="text-xs text-gray-500">
          Choose approvers hierarchically. Selected users will be required to approve expenses.
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
        {/* Admin Section */}
        {organizedUsers.admins.length > 0 && renderHierarchicalNode(
          'all-admins',
          `All Admins (${organizedUsers.admins.length})`,
          <ShieldCheckIcon className="h-4 w-4 text-red-500" />,
          organizedUsers.admins.map(renderUserNode)
        )}

        {/* Managers Section */}
        {organizedUsers.managers.length > 0 && (
          <>
            {renderHierarchicalNode(
              'all-managers',
              `All Managers (${organizedUsers.managers.length})`,
              <UsersIcon className="h-4 w-4 text-blue-500" />,
              Object.keys(managersByDepartment).map(deptName => 
                renderHierarchicalNode(
                  `dept-${deptName}`,
                  `${deptName} Managers (${managersByDepartment[deptName].length})`,
                  <UsersIcon className="h-4 w-4 text-green-500" />,
                  managersByDepartment[deptName].map(renderUserNode),
                  true
                )
              )
            )}
          </>
        )}

        {/* Individual Users Section */}
        {organizedUsers.employees.length > 0 && (
          <div className="border-t border-gray-200 pt-2">
            <div className="flex items-center py-2 px-3">
              <UsersIcon className="h-4 w-4 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Individual Employees ({organizedUsers.employees.length})
              </span>
            </div>
            {organizedUsers.employees.map(renderUserNode)}
          </div>
        )}
      </div>

      {/* Selected Approvers Summary */}
      {checkedUsers.size > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h5 className="text-sm font-medium text-blue-900 mb-2">
            Selected Approvers ({checkedUsers.size})
          </h5>
          <div className="flex flex-wrap gap-2">
            {Array.from(checkedUsers).map(userId => {
              const user = availableUsers.find(u => u._id === userId);
              if (!user) return null;
              
              return (
                <span
                  key={userId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {user.firstName} {user.lastName}
                  <button
                    type="button"
                    onClick={() => handleCheckboxChange(userId, false)}
                    className="ml-1 h-3 w-3 rounded-full hover:bg-blue-200 flex items-center justify-center"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalApproverSelector;
