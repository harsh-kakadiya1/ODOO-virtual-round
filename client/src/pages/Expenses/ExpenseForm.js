import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import OCRProcessor from '../../components/UI/OCRProcessor';
import { Receipt, Save, ArrowLeft, Upload, X, Scan } from 'lucide-react';
import { expensesAPI, companiesAPI } from '../../utils/api';
// import { useAuth } from '../../contexts/AuthContext';

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  // const { user } = useAuth(); // Not currently used
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [showOCR, setShowOCR] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCompanyInfo();
    if (isEditing) {
      fetchExpense();
    }
  }, [id, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCompanyInfo = async () => {
    try {
      const response = await companiesAPI.getCompany();
      setCompany(response.data);
      setFormData(prev => ({
        ...prev,
        currency: response.data.currency || 'USD'
      }));
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getExpense(id);
      const expense = response.data;
      setFormData({
        category: expense.category || '',
        amount: expense.amount || '',
        currency: expense.currency || 'USD',
        description: expense.description || '',
        expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : ''
      });
      // Only set receipt preview if there's actually a receipt file with a valid path
      if (expense.receipt && expense.receipt.path && expense.receipt.filename) {
        setReceiptPreview(expense.receipt.path);
      } else {
        setReceiptPreview(null);
        setReceiptFile(null);
      }
    } catch (error) {
      console.error('Error fetching expense:', error);
      navigate('/expenses');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          receipt: 'File size must be less than 5MB'
        }));
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          receipt: 'Only JPEG, PNG, GIF, and PDF files are allowed'
        }));
        return;
      }

      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      setErrors(prev => ({
        ...prev,
        receipt: ''
      }));
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    // Reset the file input
    const fileInput = document.getElementById('receipt');
    if (fileInput) {
      fileInput.value = '';
    }
    // Clear any receipt-related errors
    if (errors.receipt) {
      setErrors(prev => ({
        ...prev,
        receipt: ''
      }));
    }
  };

  const handleOCRDataExtracted = (data) => {
    setOcrError(null);
    
    // Auto-fill form fields with extracted data
    const updates = {};
    
    if (data.merchant) {
      updates.description = data.merchant;
    }
    
    if (data.total) {
      updates.amount = data.total.toString();
    }
    
    if (data.currency) {
      updates.currency = data.currency;
    }
    
    if (data.date) {
      updates.expenseDate = data.date;
    }
    
    // If we have items, create a more detailed description
    if (data.items && data.items.length > 0) {
      const itemsText = data.items.map(item => 
        `${item.description} - ${item.amount}`
      ).join(', ');
      updates.description = `${data.merchant || 'Receipt'}: ${itemsText}`;
    }
    
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Clear any existing errors for updated fields
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      if (newErrors[key]) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const handleOCRError = (error) => {
    setOcrError(error);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
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
      
      const submitData = new FormData();
      submitData.append('category', formData.category);
      submitData.append('amount', formData.amount);
      submitData.append('currency', formData.currency);
      submitData.append('description', formData.description);
      submitData.append('expenseDate', formData.expenseDate);
      
      if (receiptFile) {
        submitData.append('receipt', receiptFile);
      }

      if (isEditing) {
        await expensesAPI.updateExpense(id, submitData);
      } else {
        await expensesAPI.createExpense(submitData);
      }

      navigate('/expenses');
    } catch (error) {
      console.error('Error saving expense:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.param || 'submit'] = err.msg;
        });
        setErrors(apiErrors);
      } else {
        setErrors({ submit: 'Failed to save expense. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = company?.settings?.expenseCategories || [
    'Travel', 'Meals', 'Office Supplies', 'Transportation', 'Accommodation', 'Other'
  ];

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
          onClick={() => navigate('/expenses')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Expense' : 'Submit New Expense'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update your expense claim' : 'Fill out the form below to submit an expense claim'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <Input
                  label="Expense Date"
                  name="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={handleInputChange}
                  error={errors.expenseDate}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  error={errors.amount}
                  required
                />
              </div>

              <div>
                <Input
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  readOnly={!isEditing} // Can't change currency on edit
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter expense description..."
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt
              </label>
              
              {/* OCR Toggle Button */}
              <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOCR(!showOCR)}
                  className="flex items-center"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  {showOCR ? 'Hide AI Receipt Scanner' : 'Use AI Receipt Scanner'}
                </Button>
              </div>

              {/* OCR Section */}
              {showOCR && (
                <div className="mb-4">
                  <OCRProcessor
                    onDataExtracted={handleOCRDataExtracted}
                    onError={handleOCRError}
                  />
                  {ocrError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{ocrError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Traditional File Upload */}
              {(!receiptPreview && !receiptFile) ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="receipt" className="cursor-pointer">
                        <span className="text-sm text-blue-600 hover:text-blue-500">
                          Upload a receipt
                        </span>
                        <input
                          id="receipt"
                          name="receipt"
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF, PDF up to 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Receipt className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {receiptFile ? receiptFile.name : 'Current receipt'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {receiptFile ? `${Math.round(receiptFile.size / 1024)} KB` : 'Uploaded'}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeReceipt}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {errors.receipt && (
                <p className="mt-1 text-sm text-red-600">{errors.receipt}</p>
              )}
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
            onClick={() => navigate('/expenses')}
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
            {isEditing ? 'Update Expense' : 'Submit Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
