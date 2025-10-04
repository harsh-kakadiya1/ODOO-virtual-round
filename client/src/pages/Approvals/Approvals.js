import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { CheckCircle } from 'lucide-react';

const Approvals = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-600">Review and approve pending expense claims</p>
      </div>

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
              All expenses have been reviewed. This page will be fully implemented in the next phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Approvals;
