import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { Plus, Receipt, Eye, Edit, Trash2, Filter, GitBranch } from 'lucide-react';
import { expensesAPI, approvalsAPI, formatCurrency, formatDate, handleApiError } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Expenses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [approvalRules, setApprovalRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState('');
  const [creatingFlow, setCreatingFlow] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await expensesAPI.getExpenses(params);
      // Handle the backend response structure: { expenses: [...], pagination: {...} }
      const expensesData = response.data.expenses || response.data;
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      // Set empty array on error to prevent map errors
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId, description) => {
    if (!window.confirm(`Are you sure you want to delete "${description}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(expenseId);
      await expensesAPI.deleteExpense(expenseId);
      setExpenses(expenses.filter(expense => expense._id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEditExpense = (expense) => {
    if (!expense || !user) return false;
    const employeeId = expense.employee?._id || expense.employee;
    return expense.status === 'pending' && employeeId === user._id;
  };

  const canDeleteExpense = (expense) => {
    if (!expense || !user) return false;
    const employeeId = expense.employee?._id || expense.employee;
    return expense.status === 'pending' && employeeId === user._id;
  };

  const canCreateApprovalFlow = (expense) => {
    // Only managers and admins can create approval flows for pending expenses without existing flows
    return (
      (user?.role === 'manager' || user?.role === 'admin') &&
      expense.status === 'pending' &&
      !expense.approvalFlow
    );
  };

  const loadApprovalRules = async () => {
    try {
      const response = await approvalsAPI.getApprovalRules();
      setApprovalRules(response.data.rules || []);
    } catch (error) {
      console.error('Error loading approval rules:', error);
    }
  };

  const handleCreateApprovalFlow = (expense) => {
    setSelectedExpense(expense);
    setShowApprovalModal(true);
    loadApprovalRules();
  };

  const submitCreateApprovalFlow = async () => {
    if (!selectedRule || !selectedExpense) return;

    try {
      setCreatingFlow(true);
      await approvalsAPI.createApprovalFlow({
        expenseId: selectedExpense._id,
        ruleId: selectedRule
      });
      
      toast.success('Approval flow created successfully');
      setShowApprovalModal(false);
      setSelectedExpense(null);
      setSelectedRule('');
      fetchExpenses(); // Refresh the list
    } catch (error) {
      console.error('Error creating approval flow:', error);
      toast.error(handleApiError(error));
    } finally {
      setCreatingFlow(false);
    }
  };

  // Ensure filteredExpenses is always an array
  const filteredExpenses = Array.isArray(expenses) ? expenses : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Manage your expense claims</p>
        </div>
        <Link to="/expenses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredExpenses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {filter === 'all' ? 'No expenses yet' : `No ${filter} expenses`}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'Get started by creating your first expense claim.'
                  : `You don't have any ${filter} expenses.`
                }
              </p>
              {filter === 'all' && (
                <div className="mt-6">
                  <Link to="/expenses/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Expense
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Your Expenses ({filteredExpenses.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(expense.expenseDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Submitted: {formatDate(expense.submissionDate)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {expense.description}
                        </div>
                        {expense.receipt && (
                          <div className="flex items-center mt-1">
                            <Receipt className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">Receipt attached</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">{expense.category}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount || 0, expense.currency || 'USD')}
                        </div>
                        {expense.amountInCompanyCurrency && expense.amountInCompanyCurrency !== expense.amount && (
                          <div className="text-xs text-gray-500">
                            Company: {formatCurrency(expense.amountInCompanyCurrency)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadgeColor(expense.status)}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </Badge>
                        {expense.status === 'approved' && expense.approvedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(expense.approvedAt)}
                          </div>
                        )}
                        {expense.status === 'rejected' && expense.rejectedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(expense.rejectedAt)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/expenses/${expense._id}`)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {canEditExpense(expense) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/expenses/${expense._id}/edit`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {canCreateApprovalFlow(expense) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateApprovalFlow(expense)}
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                            >
                              <GitBranch className="h-3 w-3" />
                            </Button>
                          )}
                          {canDeleteExpense(expense) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense._id, expense.description)}
                              disabled={deleteLoading === expense._id}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              {deleteLoading === expense._id ? (
                                <LoadingSpinner className="h-3 w-3" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Approval Flow Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create Approval Flow
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create an approval flow for: {selectedExpense?.description}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Approval Rule
              </label>
              <select
                value={selectedRule}
                onChange={(e) => setSelectedRule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a rule...</option>
                {approvalRules.map(rule => (
                  <option key={rule._id} value={rule._id}>
                    {rule.name} {rule.conditions?.amountThreshold && `(${formatCurrency(rule.conditions.amountThreshold)}+)`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedExpense(null);
                  setSelectedRule('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitCreateApprovalFlow}
                disabled={!selectedRule || creatingFlow}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creatingFlow ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : (
                  <GitBranch className="h-4 w-4 mr-2" />
                )}
                Create Flow
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
