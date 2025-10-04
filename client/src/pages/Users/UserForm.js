import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { UserPlus, Save, ArrowLeft, Mail } from 'lucide-react';
import { usersAPI, departmentsAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'employee',
    manager: '',
    department: '',
    employeeId: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchManagers();
    fetchDepartments();
    if (isEditing) {
      fetchUser();
    }
  }, [id, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchManagers = async () => {
    try {
      const response = await usersAPI.getUsers();
      const managerUsers = response.data.filter(user => 
        user.role === 'manager' || user.role === 'admin'
      );
      setManagers(managerUsers);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error(handleApiError(error));
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error(handleApiError(error));
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUser(id);
      const user = response.data;
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '', // Never pre-fill password
        role: user.role || 'employee',
        manager: user.manager?._id || '',
        department: user.department?._id || '',
        employeeId: user.employeeId || '',
        phone: user.phone || ''
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error(handleApiError(error));
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    // Password validation only for editing existing users (and only if they provide a password)
    if (isEditing && formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const submitData = { ...formData };
      // For new users, don't send password (it will be auto-generated)
      // For editing, only send password if it's provided
      if (!isEditing) {
        delete submitData.password;
      } else if (isEditing && !submitData.password) {
        delete submitData.password;
      }

      if (isEditing) {
        await usersAPI.updateUser(id, submitData);
        toast.success('User updated successfully');
      } else {
        await usersAPI.createUser(submitData);
        toast.success('User created successfully! Welcome email with login credentials has been sent.');
      }

      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.param || 'submit'] = err.msg;
        });
        setErrors(apiErrors);
        toast.error('Please fix the form errors');
      } else {
        const errorMessage = handleApiError(error);
        setErrors({ submit: errorMessage });
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/users')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update team member information' : 'Create a new team member account'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={errors.firstName}
                  required
                />
              </div>
              <div>
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={errors.lastName}
                  required
                />
              </div>
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                required
              />
            </div>

            {isEditing && (
              <div>
                <Input
                  label="New Password (leave blank to keep current)"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                />
              </div>
            )}

            {!isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Login Credentials Will Be Sent via Email
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        A secure temporary password will be automatically generated and sent to the user's email address along with their login credentials and welcome instructions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </label>
                <select
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Manager (Optional)</option>
                  {managers.map(manager => (
                    <option key={manager._id} value={manager._id}>
                      {manager.firstName} {manager.lastName} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="Employee ID"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/users')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <LoadingSpinner className="w-4 h-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
