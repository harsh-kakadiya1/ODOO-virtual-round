import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { Receipt, ArrowLeft, Edit, Download, User, Calendar, DollarSign, Tag, FileText, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { expensesAPI, formatDate, formatDateTime } from '../../utils/api';
import Money from '../../components/UI/Money';
import { useAuth } from '../../contexts/AuthContext';

const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchExpenseDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getExpense(id);
      setExpense(response.data);
    } catch (error) {
      console.error('Error fetching expense details:', error);
      setError('Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteExpense = async () => {
    if (!expense) return;

    try {
      setDeleteLoading(true);
      await expensesAPI.deleteExpense(expense._id);
      navigate('/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const canDeleteExpense = (expense) => {
    if (!expense || !user) return false;
    const employeeId = expense.employee?._id || expense.employee;
    return expense.status === 'pending' && employeeId === user._id;
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canEditExpense = () => {
    if (!expense || !user) return false;
    const employeeId = expense.employee?._id || expense.employee;
    return expense.status === 'pending' && employeeId === user._id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/expenses')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expenses
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Not Found</h1>
            <p className="text-gray-600">The expense you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/expenses')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expenses
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
            <p className="text-gray-600">View expense claim details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {canEditExpense() && (
            <Link to={`/expenses/${expense._id}/edit`}>
              <Button className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit Expense
              </Button>
            </Link>
          )}
          {canDeleteExpense(expense) && (
            <Button
              variant="outline"
              onClick={handleDeleteClick}
              disabled={deleteLoading}
              className="flex items-center text-red-600 hover:text-red-700 hover:border-red-300"
            >
              {deleteLoading ? (
                <LoadingSpinner className="h-4 w-4 mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Expense
            </Button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(expense.status)}
                <Badge className={`${getStatusBadgeColor(expense.status)} flex items-center space-x-1`}>
                  <span>{expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}</span>
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                <Money amount={expense.amount} currency={expense.currency} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Submitted</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDateTime(expense.submissionDate)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <FileText className="h-4 w-4 mr-1" />
                  Description
                </div>
                <p className="text-gray-900">{expense.description}</p>
              </div>
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Tag className="h-4 w-4 mr-1" />
                  Category
                </div>
                <p className="text-gray-900">{expense.category}</p>
              </div>
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Expense Date
                </div>
                <p className="text-gray-900">{formatDate(expense.expenseDate)}</p>
              </div>
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Currency
                </div>
                <p className="text-gray-900">{expense.currency}</p>
              </div>
            </div>
            
            {expense.exchangeRate && expense.exchangeRate !== 1 && (
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Exchange Rate
                </div>
                <p className="text-gray-900">1 {expense.currency} = {expense.exchangeRate} (Company Currency)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                Employee Name
              </div>
              <p className="text-gray-900">
                {expense.employee?.firstName} {expense.employee?.lastName}
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                Email
              </div>
              <p className="text-gray-900">{expense.employee?.email}</p>
            </div>
            {expense.employee?.department && (
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Department
                </div>
                <p className="text-gray-900">{expense.employee.department}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt */}
      {expense.receipt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <Receipt className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {expense.receipt.originalName || 'Receipt'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded on {formatDate(expense.receipt.uploadDate)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => {
                  // In a real app, this would download the file
                  alert('Receipt download functionality would be implemented here');
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Information */}
      {(expense.status === 'approved' || expense.status === 'rejected') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {expense.status === 'approved' ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 mr-2 text-red-600" />
              )}
              {expense.status === 'approved' ? 'Approval Information' : 'Rejection Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {expense.status === 'approved' ? 'Approved By' : 'Rejected By'}
                </div>
                <p className="text-gray-900">
                  {expense.status === 'approved' 
                    ? `${expense.approvedBy?.firstName} ${expense.approvedBy?.lastName}`
                    : `${expense.rejectedBy?.firstName} ${expense.rejectedBy?.lastName}`
                  }
                </p>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Date
                </div>
                <p className="text-gray-900">
                  {formatDateTime(expense.approvedAt || expense.rejectedAt)}
                </p>
              </div>
            </div>
            {expense.rejectionReason && (
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Rejection Reason
                </div>
                <p className="text-gray-900">{expense.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {expense.tags && expense.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expense.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && expense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Expense</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the expense <strong>"{expense.description}"</strong>?
              </p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  <div><strong>Amount:</strong> <Money amount={expense.amount} currency={expense.currency} /></div>
                  <div><strong>Category:</strong> {expense.category}</div>
                  <div><strong>Date:</strong> {formatDate(expense.expenseDate)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteExpense}
                disabled={deleteLoading}
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
              >
                {deleteLoading ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Expense
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetails;
