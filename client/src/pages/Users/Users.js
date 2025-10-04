import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import { Plus, Users as UsersIcon, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';
import { usersAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userName}?`)) {
      return;
    }

    try {
      await usersAPI.deleteUser(userId);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(handleApiError(error));
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'employee': return 'success';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage team members and their roles</p>
        </div>
        {hasRole('admin') && (
          <Link to="/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </Link>
        )}
      </div>

      {users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <UsersIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  {user.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      {user.department}
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {user.phone}
                    </div>
                  )}
                  {user.employeeId && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">ID:</span> {user.employeeId}
                    </div>
                  )}
                  {user.manager && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Manager:</span> {user.manager.firstName} {user.manager.lastName}
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Approver:</span>
                    <Badge variant={user.isManagerApprover ? 'success' : 'secondary'} size="sm">
                      {user.isManagerApprover ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                {hasRole('admin') && (
                  <div className="flex space-x-2">
                    <Link 
                      to={`/users/${user._id}/edit`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                      disabled={user._id === currentUser.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding team members to your organization.
            </p>
            {hasRole('admin') && (
              <div className="mt-6">
                <Link to="/users/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First User
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users;
