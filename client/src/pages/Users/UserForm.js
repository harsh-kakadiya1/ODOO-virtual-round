import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { UserPlus } from 'lucide-react';

const UserForm = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
        <p className="text-gray-600">Create a new team member account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">User Form</h3>
            <p className="mt-1 text-sm text-gray-500">
              This form will be implemented in the next development phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserForm;
