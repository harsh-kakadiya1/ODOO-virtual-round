import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import PasswordStrengthIndicator from '../../components/UI/PasswordStrengthIndicator';
import { Receipt, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateCompanyName 
} from '../../utils/validation';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    country: '',
    currency: 'USD'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const { countries, setCurrency, loadingCountries } = useCurrency();

  // Debounced company name check
  const checkCompanyName = useCallback(async (companyName) => {
    if (!companyName || companyName.trim().length < 2) return;
    
    try {
      setIsCheckingCompany(true);
      const response = await api.get(`/auth/check-company/${encodeURIComponent(companyName.trim())}`);
      
      if (response.data.exists) {
        setFieldErrors(prev => ({
          ...prev,
          companyName: 'Company name is already taken. Please choose a different name.'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          companyName: ''
        }));
      }
    } catch (error) {
      console.error('Error checking company name:', error);
    } finally {
      setIsCheckingCompany(false);
    }
  }, []);

  // Debounced email check
  const checkEmail = useCallback(async (email) => {
    if (!email || !validateEmail(email)) return;
    
    try {
      setIsCheckingEmail(true);
      const response = await api.get(`/auth/check-email/${encodeURIComponent(email.trim())}`);
      
      if (response.data.exists) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'Email is already taken. Please choose a different email.'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Debounce company name checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.companyName && formData.companyName.trim().length >= 2) {
        checkCompanyName(formData.companyName);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [formData.companyName, checkCompanyName]);

  // Debounce email checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email && validateEmail(formData.email)) {
        checkEmail(formData.email);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [formData.email, checkEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }

    // Auto-update currency when country changes
    if (name === 'country') {
      const countryData = countries.find(c => c.code === value);
      if (countryData) {
        const newCurrency = countryData.currency || 'USD';
        setFormData(prev => ({
          ...prev,
          [name]: value,
          currency: newCurrency
        }));
        setCurrency(newCurrency);
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    // First name validation
    const firstNameValidation = validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.message;
    }

    // Last name validation
    const lastNameValidation = validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.message;
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      const missing = [];
      if (!passwordValidation.hasMinLength) missing.push('at least 8 characters');
      if (!passwordValidation.hasUpperCase) missing.push('one uppercase letter');
      if (!passwordValidation.hasLowerCase) missing.push('one lowercase letter');
      if (!passwordValidation.hasNumber) missing.push('one number');
      if (!passwordValidation.hasSpecialChar) missing.push('one special character');
      errors.password = `Password must contain ${missing.join(', ')}`;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Company name validation
    const companyValidation = validateCompanyName(formData.companyName);
    if (!companyValidation.isValid) {
      errors.companyName = companyValidation.message;
    }

    // Country validation
    if (!formData.country) {
      errors.country = 'Please select a country';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const result = await register(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      // Handle field-specific errors from backend
      if (result.errors && Array.isArray(result.errors)) {
        const backendErrors = {};
        result.errors.forEach(err => {
          backendErrors[err.field] = err.message;
        });
        setFieldErrors(backendErrors);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Receipt className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && !Object.keys(fieldErrors).length && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="First name"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className={fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <Input
                  label="Last name"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Company name"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                  className={fieldErrors.companyName ? 'border-red-500 focus:border-red-500' : ''}
                />
                {isCheckingCompany && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center top-6">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
              {fieldErrors.companyName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.companyName}</p>
              )}
              {isCheckingCompany && (
                <p className="mt-1 text-sm text-gray-500">Checking company name availability...</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                    fieldErrors.country ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.country && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.country}</p>
                )}
              </div>

              <div>
                <Input
                  label="Currency"
                  name="currency"
                  type="text"
                  required
                  value={formData.currency}
                  onChange={handleChange}
                  placeholder="Currency"
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={loading || isSubmitting}
              disabled={loading || isSubmitting}
            >
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;