import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { CheckCircle, X, Eye, User, Receipt } from 'lucide-react';
import { approvalsAPI, formatCurrency, formatDate } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const Approvals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState('approve');

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      fetchPendingApprovals();
    }
  }, [user]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await approvalsAPI.getPendingApprovals();
      // Handle the response structure properly - the API returns { expenses: [], pagination: {} }
      const expenses = response.data.expenses || response.data || [];
      setPendingApprovals(Array.isArray(expenses) ? expenses : []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovals([]); // Set empty array in case of error
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (expense, action) => {
    setSelectedExpense(expense);
    setActionType(action);
    setComment('');
    setShowCommentModal(true);
  };

  const submitApprovalAction = async () => {
    if (!selectedExpense) return;

    try {
      setActionLoading(selectedExpense._id);
      
      if (actionType === 'approve') {
        await approvalsAPI.approveExpense(selectedExpense._id, {
          comments: comment
        });
      } else {
        await approvalsAPI.rejectExpense(selectedExpense._id, {
          reason: comment || 'No reason provided'
        });
      }

      // Remove from pending list
      setPendingApprovals(prev => 
        prev.filter(expense => expense._id !== selectedExpense._id)
      );
      
      setShowCommentModal(false);
      setSelectedExpense(null);
      setComment('');
    } catch (error) {
      console.error(`Error ${actionType}ing expense:`, error);
      alert(`Failed to ${actionType} expense. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Only show to managers and admins
  if (user?.role === 'employee') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600">Access denied</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <X className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to view approvals.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-600">Review and approve pending expense claims</p>
      </div>

      {!Array.isArray(pendingApprovals) || pendingApprovals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
              <p className="mt-1 text-sm text-gray-500">
                All expenses have been reviewed.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Pending Approvals ({Array.isArray(pendingApprovals) ? pendingApprovals.length : 0})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(pendingApprovals) && pendingApprovals.map((expense) => (
                <div key={expense._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {expense.employee?.firstName} {expense.employee?.lastName}
                          </span>
                        </div>
                        <Badge className={getStatusBadgeColor(expense.status)}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(expense.submissionDate)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Description
                          </span>
                          <p className="text-sm text-gray-900 mt-1">{expense.description}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Category
                          </span>
                          <p className="text-sm text-gray-900 mt-1">{expense.category}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Amount
                          </span>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {formatCurrency(expense.amount, expense.currency)}
                          </p>
                          {expense.currency !== expense.amountInCompanyCurrency && (
                            <p className="text-xs text-gray-500">
                              {formatCurrency(expense.amountInCompanyCurrency)}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Date
                          </span>
                          <p className="text-sm text-gray-900 mt-1">
                            {formatDate(expense.expenseDate)}
                          </p>
                        </div>
                      </div>

                      {expense.receipt && (
                        <div className="flex items-center mb-4">
                          <Receipt className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">Receipt attached</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/expenses/${expense._id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprovalAction(expense, 'approve')}
                        disabled={actionLoading === expense._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === expense._id ? (
                          <LoadingSpinner className="h-3 w-3 mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprovalAction(expense, 'reject')}
                        disabled={actionLoading === expense._id}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Expense' : 'Reject Expense'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedExpense?.description}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? 'Comments (optional)' : 'Rejection reason'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={actionType === 'approve' ? 'Add any comments...' : 'Please provide a reason for rejection'}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentModal(false);
                  setSelectedExpense(null);
                  setComment('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitApprovalAction}
                disabled={actionLoading}
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionLoading ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : actionType === 'approve' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
