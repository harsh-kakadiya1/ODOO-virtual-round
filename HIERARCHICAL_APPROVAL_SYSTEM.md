# Hierarchical Approval System

## Overview

The Hierarchical Approval System provides a comprehensive, checkbox-based interface for managing expense approvals with organizational hierarchy support. This system allows administrators to configure approval rules that respect company structure and ensure proper oversight.

## Features

### 🎯 Core Features

- **Hierarchical Approver Selection**: Tree-like interface for selecting approvers by role and department
- **Mandatory Approval Logic**: All selected approvers must approve expenses
- **Company Hierarchy Support**: Respects Admin → Manager → Employee structure
- **Department Organization**: Managers grouped by department for easy selection
- **Flexible Configuration**: Support for partial approval and escalation scenarios
- **Real-time Validation**: Immediate feedback on approval rule configuration

### 🔧 Technical Features

- **Checkbox-based Selection**: Intuitive interface with expandable/collapsible sections
- **Bulk Selection**: Select all admins, all managers, or department-specific managers
- **Individual Selection**: Choose specific employees for approval
- **Validation Engine**: Ensures proper approval rule configuration
- **Notification System**: Real-time updates for approval status changes

## System Architecture

### Frontend Components

#### HierarchicalApproverSelector
```javascript
// Main component for hierarchical approver selection
<HierarchicalApproverSelector
  availableUsers={users}
  selectedApprovers={selectedApprovers}
  onChange={handleApproverChange}
  companyHierarchy={hierarchy}
  disabled={false}
/>
```

**Features:**
- Tree-like expandable interface
- Role-based grouping (Admin, Manager, Employee)
- Department-based sub-grouping for managers
- Bulk selection capabilities
- Individual user selection
- Real-time selection summary

#### EnhancedApprovalRuleForm
```javascript
// Enhanced form for creating/editing approval rules
<EnhancedApprovalRuleForm
  rule={existingRule}
  onSave={handleSave}
  onCancel={handleCancel}
  availableUsers={users}
  availableCategories={categories}
  availableDepartments={departments}
/>
```

**Features:**
- Hierarchical approval logic type
- Conditional rule builder integration
- Escalation configuration
- Step-based approval workflow
- Validation and error handling

### Backend Components

#### HierarchicalApprovalEngine
```javascript
// Core engine for processing hierarchical approvals
const HierarchicalApprovalEngine = {
  createHierarchicalApprovalFlow,
  processHierarchicalApproval,
  evaluateStepCompletion,
  getHierarchicalPendingApprovals,
  handleHierarchicalEscalation
};
```

**Capabilities:**
- Creates approval flows based on hierarchical rules
- Processes approvals with mandatory requirements
- Evaluates step completion based on settings
- Handles escalation scenarios
- Manages notification workflows

#### Enhanced ApprovalRule Model
```javascript
// Enhanced model with hierarchical settings
{
  approvalLogic: {
    type: 'hierarchical',
    hierarchicalSettings: {
      requireAllSelected: true,
      allowPartialApproval: false,
      escalationEnabled: false,
      escalationTimeoutHours: 72,
      escalationTo: userId
    }
  }
}
```

## Usage Guide

### 1. Creating Hierarchical Approval Rules

#### Step 1: Access Approval Rules
Navigate to **Approvals** → **Approval Rules** in the admin panel.

#### Step 2: Create New Rule
Click **"Add New Rule"** and select **"Hierarchical (Recommended)"** as the approval logic type.

#### Step 3: Configure Hierarchical Settings
- **Require All Selected Approvers**: All selected users must approve
- **Allow Partial Approval**: Enable majority-based approval
- **Enable Escalation**: Set timeout and escalation target

#### Step 4: Select Approvers Hierarchically
Use the hierarchical selector to choose approvers:

```
📁 All Admins (2) ☑️
  ├── 👤 John Admin (john.admin@company.com)
  └── 👤 Jane Admin (jane.admin@company.com)

📁 All Managers (5) ☑️
  ├── 📁 Engineering Managers (3)
  │   ├── 👤 Sarah Manager (sarah@company.com)
  │   ├── 👤 Mike TechLead (mike@company.com)
  │   └── 👤 Alex Senior (alex@company.com)
  └── 📁 Sales Managers (2)
      ├── 👤 Lisa SalesManager (lisa@company.com)
      └── 👤 Tom SalesLead (tom@company.com)

📁 Individual Employees (10)
  ├── 👤 Bob Employee (bob@company.com)
  └── 👤 Alice Employee (alice@company.com)
```

### 2. Approval Process Flow

#### Step 1: Expense Submission
Employee submits expense → System matches against approval rules → Creates hierarchical approval flow

#### Step 2: Approval Flow Creation
```javascript
// System creates flow with selected approvers
const approvalFlow = {
  currentStep: 1,
  totalSteps: 2,
  steps: [
    {
      stepNumber: 1,
      approvers: [
        { user: adminId, status: 'pending', isRequired: true },
        { user: managerId, status: 'pending', isRequired: true }
      ]
    }
  ]
};
```

#### Step 3: Approval Processing
- Each approver receives notification
- Approvals processed through hierarchical engine
- System tracks completion status
- Escalation triggered if timeout exceeded

#### Step 4: Completion
- All required approvers approve → Expense approved
- Any required approver rejects → Expense rejected
- Partial approval (if enabled) → Majority rule applied

### 3. Configuration Options

#### Hierarchical Settings
```javascript
hierarchicalSettings: {
  requireAllSelected: true,        // All selected must approve
  allowPartialApproval: false,     // Allow majority approval
  escalationEnabled: true,         // Enable escalation
  escalationTimeoutHours: 72,      // 3 days timeout
  escalationTo: escalationUserId   // Who to escalate to
}
```

#### Approval Logic Types
- **Hierarchical**: Recommended, checkbox-based selection
- **Sequential**: Step-by-step approval
- **Percentage**: Require percentage of approvers
- **Specific Approver**: Auto-approve on specific approval
- **Hybrid**: Combine multiple approaches

## API Endpoints

### Get Available Approvers
```http
GET /api/approvals/available-approvers
Authorization: Bearer <token>

Response:
{
  "users": [...],
  "organized": {
    "admins": [...],
    "managers": [...],
    "employees": [...]
  },
  "hierarchy": {
    "totalAdmins": 2,
    "totalManagers": 5,
    "totalEmployees": 20
  }
}
```

### Create Hierarchical Approval Rule
```http
POST /api/approval-rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "High Value Expenses",
  "approvalLogic": {
    "type": "hierarchical",
    "hierarchicalSettings": {
      "requireAllSelected": true,
      "allowPartialApproval": false,
      "escalationEnabled": true,
      "escalationTimeoutHours": 72
    }
  },
  "approvalSteps": [
    {
      "stepNumber": 1,
      "approvers": ["adminId1", "managerId1"],
      "isRequired": true
    }
  ]
}
```

## Best Practices

### 1. Rule Configuration
- **Start Simple**: Begin with basic hierarchical rules
- **Test Thoroughly**: Validate rules with test expenses
- **Monitor Performance**: Track approval times and bottlenecks
- **Regular Review**: Update rules based on organizational changes

### 2. Approver Selection
- **Respect Hierarchy**: Follow organizational structure
- **Avoid Overlap**: Prevent redundant approvals
- **Consider Workload**: Balance approval responsibilities
- **Plan for Absences**: Configure escalation properly

### 3. Escalation Management
- **Set Realistic Timeouts**: Consider business hours and workload
- **Choose Escalation Targets**: Select appropriate escalation recipients
- **Monitor Escalations**: Track escalation frequency and reasons
- **Review and Adjust**: Modify timeouts based on experience

## Troubleshooting

### Common Issues

#### 1. Approvers Not Receiving Notifications
- Check user email configuration
- Verify notification service status
- Confirm user is active and has proper role

#### 2. Approval Flow Stuck
- Review escalation settings
- Check for circular dependencies
- Verify approver availability

#### 3. Validation Errors
- Ensure all required fields are filled
- Check approver selection validity
- Verify escalation target permissions

### Debug Mode
Enable debug logging to trace approval flow execution:
```javascript
// Set in environment variables
DEBUG=hierarchical-approval:*
```

## Migration Guide

### From Legacy System
1. Export existing approval rules
2. Map to new hierarchical structure
3. Test with sample expenses
4. Deploy and monitor

### Data Migration
```javascript
// Example migration script
const migrateApprovalRules = async () => {
  const legacyRules = await LegacyApprovalRule.find({});
  
  for (const rule of legacyRules) {
    const newRule = new ApprovalRule({
      ...rule.toObject(),
      approvalLogic: {
        type: 'hierarchical',
        hierarchicalSettings: {
          requireAllSelected: true,
          allowPartialApproval: false,
          escalationEnabled: rule.escalation?.enabled || false
        }
      }
    });
    
    await newRule.save();
  }
};
```

## Future Enhancements

### Planned Features
- **Smart Routing**: AI-based approver recommendations
- **Mobile Optimization**: Enhanced mobile approval interface
- **Advanced Analytics**: Approval pattern analysis
- **Integration APIs**: Third-party system integration
- **Workflow Automation**: Automated approval routing

### Customization Options
- **Custom Hierarchies**: Support for complex organizational structures
- **Dynamic Rules**: Context-aware approval rules
- **Advanced Escalation**: Multi-level escalation paths
- **Approval Templates**: Pre-configured approval scenarios

## Support

For technical support or feature requests:
- Create an issue in the project repository
- Contact the development team
- Check the documentation wiki
- Review the FAQ section

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatibility**: Node.js 16+, React 18+
