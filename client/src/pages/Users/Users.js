import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';
import { Plus, Users as UsersIcon, Edit, Trash2, Mail, Phone, Building, User, Filter } from 'lucide-react';
import { usersAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'manager', 'employee'

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      fetchUsers(); // Refresh the users list instead of filtering locally
    } catch (error) {
      console.error('Error deleting user:', error);
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
    if (hasRole('admin')) return true;
    if (hasRole('manager') && user.role === 'employee') return true;
    return currentUser._id === user._id;
  };

  const canDeleteUser = (user) => {
    if (currentUser._id === user._id) return false; // Can't delete yourself
    return hasRole('admin');
  };

  // Filter users based on selected role
  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter(user => user.role === roleFilter);
  }, [users, roleFilter]);

  // Get count for each role
  const roleCounts = useMemo(() => {
    const counts = { all: users.length, admin: 0, manager: 0, employee: 0 };
    users.forEach(user => {
      if (counts[user.role] !== undefined) {
        counts[user.role]++;
      }
    });
    return counts;
  }, [users]);

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

      {/* Role Filter Buttons */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Role:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={roleFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('all')}
              className="flex items-center"
            >
              All Users
              <Badge variant="secondary" className="ml-2">
                {roleCounts.all}
              </Badge>
            </Button>
            <Button
              variant={roleFilter === 'admin' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('admin')}
              className="flex items-center"
            >
              Admins
              <Badge variant="error" className="ml-2">
                {roleCounts.admin}
              </Badge>
            </Button>
            <Button
              variant={roleFilter === 'manager' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('manager')}
              className="flex items-center"
            >
              Managers
              <Badge variant="warning" className="ml-2">
                {roleCounts.manager}
              </Badge>
            </Button>
            <Button
              variant={roleFilter === 'employee' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('employee')}
              className="flex items-center"
            >
              Employees
              <Badge variant="success" className="ml-2">
                {roleCounts.employee}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 ? (
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {users.length === 0 ? 'No Users Found' : `No ${roleFilter === 'all' ? '' : roleFilter + ' '}users found`}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {users.length === 0 
                  ? 'Get started by adding your first team member.'
                  : `There are no ${roleFilter === 'all' ? '' : roleFilter + ' '}users to display.`
                }
              </p>
              {hasRole('admin') && users.length === 0 && (
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
                Team Members ({filteredUsers.length}{roleFilter !== 'all' ? ` of ${users.length}` : ''})
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
                  {filteredUsers.map((user) => (
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
