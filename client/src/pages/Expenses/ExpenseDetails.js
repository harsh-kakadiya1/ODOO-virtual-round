import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Receipt } from 'lucide-react';

const ExpenseDetails = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
        <p className="text-gray-600">View expense claim details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Expense Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Expense Details</h3>
            <p className="mt-1 text-sm text-gray-500">
              This page will be implemented in the next development phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseDetails;
