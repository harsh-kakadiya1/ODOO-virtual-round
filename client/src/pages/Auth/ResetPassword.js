import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      toast.error('Invalid reset link');
      navigate('/login');
      return;
    }
    setToken(resetToken);
  }, [searchParams, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast.error('Password does not meet security requirements');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({
        token,
        password: formData.password
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.password);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Password Reset Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Password
            </CardTitle>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {formData.password && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-gray-700">Password Requirements:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      One number
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      One special character
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
              
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                disabled={!passwordValidation.isValid || formData.password !== formData.confirmPassword}
              >
                Reset Password
              </Button>
              
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;