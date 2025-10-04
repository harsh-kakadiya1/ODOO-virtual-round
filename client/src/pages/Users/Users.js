import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';
import { Plus, Users as UsersIcon, Edit, Trash2, Mail, Phone, Building, User } from 'lucide-react';
import { usersAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      await usersAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setDeleteLoading(null);
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

  const canEditUser = (user) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'manager' && user.role === 'employee') return true;
    return currentUser._id === user._id;
  };

  const canDeleteUser = (user) => {
    if (currentUser._id === user._id) return false; // Can't delete yourself
    return currentUser.role === 'admin';
  };

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

      {users.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Users Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first team member.
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
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-2" />
                Team Members ({users.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Manager</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.employeeId && (
                              <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {user.manager ? (
                          <div className="text-sm text-gray-900">
                            {user.manager.firstName} {user.manager.lastName}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No manager</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {user.department ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <Building className="h-4 w-4 mr-1 text-gray-400" />
                            {user.department}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {canEditUser(user) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/users/${user._id}/edit`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {canDeleteUser(user) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                              disabled={deleteLoading === user._id}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              {deleteLoading === user._id ? (
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
    </div>
  );
};

export default Users;
