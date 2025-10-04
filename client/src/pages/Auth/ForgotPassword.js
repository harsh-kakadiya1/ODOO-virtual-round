import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, Mail } from 'lucide-react';
import { authAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setEmailSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  We've sent a password reset link to:
                </p>
                <p className="font-medium text-gray-900 mb-6">
                  {email}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Check your email and click the link to reset your password. 
                  The link will expire in 1 hour for security reasons.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Email
                  </Button>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </div>
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
              Forgot Password
            </CardTitle>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                autoFocus
              />
              
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Send Reset Link
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

export default ForgotPassword;