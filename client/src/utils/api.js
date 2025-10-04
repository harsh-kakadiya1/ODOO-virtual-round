import axios from 'axios';
import { convertAmount, fetchRates } from '../services/currencyService';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 60000, // Increased timeout to 60 seconds for OCR processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const companiesAPI = {
  getCompany: () => api.get('/companies'),
  updateCompany: (companyData) => api.put('/companies', companyData),
  updateSettings: (settings) => api.put('/companies/settings', settings),
};

export const expensesAPI = {
  getExpenses: (params) => api.get('/expenses', { params }),
  getExpense: (id) => api.get(`/expenses/${id}`),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

export const approvalsAPI = {
  getPendingApprovals: (params) => api.get('/approvals/pending', { params }),
  approveExpense: (expenseId, data) => api.post(`/approvals/${expenseId}/approve`, data),
  rejectExpense: (expenseId, data) => api.post(`/approvals/${expenseId}/reject`, data),
  getApprovalFlows: (params) => api.get('/approvals/flows', { params }),
  getApprovalFlow: (id) => api.get(`/approvals/flows/${id}`),
  createApprovalFlow: (data) => api.post('/approvals/flows', data),
  approveFlow: (flowId, data) => api.post(`/approvals/flows/${flowId}/approve`, data),
  rejectFlow: (flowId, data) => api.post(`/approvals/flows/${flowId}/reject`, data),
  getApprovalRules: () => api.get('/approval-rules'),
  createApprovalRule: (ruleData) => api.post('/approval-rules', ruleData),
  updateApprovalRule: (id, ruleData) => api.put(`/approval-rules/${id}`, ruleData),
  deleteApprovalRule: (id) => api.delete(`/approval-rules/${id}`),
  toggleApprovalRule: (id) => api.patch(`/approval-rules/${id}/toggle`),
  getAvailableApprovers: () => api.get('/approval-rules/available-approvers'),
};

export const ocrAPI = {
  extractReceiptData: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/ocr/extract-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  extractText: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/ocr/extract-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getStatus: () => api.get('/ocr/status'),
};

// Utility functions
export const handleApiError = (error) => {
  const message = error.response?.data?.message || 'An error occurred';
  const status = error.response?.status;
  
  if (status === 400) {
    return `Bad Request: ${message}`;
  } else if (status === 401) {
    return 'Unauthorized: Please log in again';
  } else if (status === 403) {
    return 'Forbidden: You do not have permission to perform this action';
  } else if (status === 404) {
    return 'Not Found: The requested resource was not found';
  } else if (status === 422) {
    return `Validation Error: ${message}`;
  } else if (status >= 500) {
    return 'Server Error: Please try again later';
  }
  
  return message;
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Convert amount from baseCurrency to targetCurrency and format
export const convertAndFormat = async (amount, baseCurrency = 'USD', targetCurrency = 'USD') => {
  if (!amount) return formatCurrency(0, targetCurrency);
  if (baseCurrency === targetCurrency) return formatCurrency(amount, targetCurrency);
  try {
    const converted = await convertAmount(amount, baseCurrency, targetCurrency);
    return formatCurrency(converted, targetCurrency);
  } catch (e) {
    // fallback to formatting original amount
    console.error('convertAndFormat error', e);
    return formatCurrency(amount, targetCurrency);
  }
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const notificationsAPI = {
  getNotifications: (page = 1, limit = 20, unreadOnly = false) => 
    api.get('/notifications', { params: { page, limit, unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

export default api;
