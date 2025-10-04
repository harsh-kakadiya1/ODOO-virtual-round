import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';
import { handleApiError, approvalsAPI } from '../../utils/api';

const ApprovalFlows = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('all');
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
    loadFlows();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFlows = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await approvalsAPI.getApprovalFlows(params);
      setFlows(response.data.flows || []);
    } catch (error) {
      console.error('Error loading approval flows:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (flowId, action, comment = '') => {
    try {
      let result;
      if (action === 'approve') {
        result = await approvalsAPI.approveFlow(flowId, { comment });
      } else {
        result = await approvalsAPI.rejectFlow(flowId, { comment });
      }
      
      toast.success(result.data.message);
      setApprovalComment('');
      setShowDetails(false);
      loadFlows();
    } catch (error) {
      console.error(`Error ${action} approval:`, error);
      toast.error(handleApiError(error));
    }
  };

  const viewFlowDetails = async (flowId) => {
    try {
      const response = await approvalsAPI.getApprovalFlow(flowId);
      setSelectedFlow(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading flow details:', error);
      toast.error(handleApiError(error));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'active':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStepStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <h1 className="text-3xl font-bold text-gray-900">Approval Flows</h1>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Flows</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Flow Details Modal */}
      {showDetails && selectedFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Approval Flow Details
                </h2>
                <Button variant="secondary" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>

              {/* Expense Information */}
              <Card className="mb-6">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Expense Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">${selectedFlow.expense?.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-semibold">{selectedFlow.expense?.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-semibold">{selectedFlow.expense?.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Employee</p>
                      <p className="font-semibold">
                        {selectedFlow.expense?.employee?.firstName} {selectedFlow.expense?.employee?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold">
                        {selectedFlow.expense?.date ? formatDate(selectedFlow.expense.date) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={getStatusColor(selectedFlow.status)}>
                        {selectedFlow.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Approval Steps */}
              <Card className="mb-6">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Approval Steps</h3>
                  <div className="space-y-4">
                    {selectedFlow.steps?.map((step, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">Step {step.stepNumber}</h4>
                            <p className="text-sm text-gray-600">
                              Approvers: {step.approvers?.map(approver => 
                                `${approver.firstName} ${approver.lastName}`
                              ).join(', ')}
                            </p>
                          </div>
                          <Badge variant={getStepStatusColor(step.status)}>
                            {step.status}
                          </Badge>
                        </div>
                        
                        {step.approvedBy && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Approved by: {step.approvedBy.firstName} {step.approvedBy.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Date: {formatDate(step.approvedAt)}
                            </p>
                            {step.comment && (
                              <p className="text-sm text-gray-600">
                                Comment: {step.comment}
                              </p>
                            )}
                          </div>
                        )}

                        {step.rejectedBy && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Rejected by: {step.rejectedBy.firstName} {step.rejectedBy.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Date: {formatDate(step.rejectedAt)}
                            </p>
                            {step.comment && (
                              <p className="text-sm text-gray-600">
                                Comment: {step.comment}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action buttons for pending steps */}
                        {step.status === 'pending' && step.approvers?.some(approver => 
                          approver._id === JSON.parse(localStorage.getItem('user'))?.id
                        ) && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comment (optional)
                              </label>
                              <textarea
                                value={approvalComment}
                                onChange={(e) => setApprovalComment(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Add a comment..."
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleApproval(selectedFlow._id, 'approve', approvalComment)}
                                variant="success"
                                size="sm"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleApproval(selectedFlow._id, 'reject', approvalComment)}
                                variant="danger"
                                size="sm"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Rule Information */}
              {selectedFlow.rule && (
                <Card>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Applied Rule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Rule Name</p>
                        <p className="font-semibold">{selectedFlow.rule.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Priority</p>
                        <p className="font-semibold">{selectedFlow.rule.priority}</p>
                      </div>
                      {selectedFlow.rule.description && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="font-semibold">{selectedFlow.rule.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flows List */}
      <div className="grid gap-6">
        {flows.length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'No approval flows found.' 
                  : `No ${filter} approval flows found.`
                }
              </p>
            </div>
          </Card>
        ) : (
          flows.map(flow => (
            <Card key={flow._id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {flow.expense?.description || 'Expense Approval'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      ${flow.expense?.amount} - {flow.expense?.category}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Employee: {flow.expense?.employee?.firstName} {flow.expense?.employee?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(flow.status)}>
                      {flow.status}
                    </Badge>
                    {flow.rule && (
                      <Badge variant="info">
                        {flow.rule.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Current Step */}
                {flow.currentStep && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      Current Step: {flow.currentStep.stepNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Pending approvers: {flow.currentStep.approvers?.map(approver => 
                        `${approver.firstName} ${approver.lastName}`
                      ).join(', ')}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Created: {formatDate(flow.createdAt)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => viewFlowDetails(flow._id)}
                    >
                      View Details
                    </Button>
                    
                    {/* Quick approval buttons for pending flows */}
                    {flow.status === 'active' && flow.currentStep?.approvers?.some(approver => 
                      approver._id === JSON.parse(localStorage.getItem('user'))?.id
                    ) && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApproval(flow._id, 'approve')}
                        >
                          Quick Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleApproval(flow._id, 'reject')}
                        >
                          Quick Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalFlows;