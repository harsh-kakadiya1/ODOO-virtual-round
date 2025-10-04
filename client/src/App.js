import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Expenses from './pages/Expenses/Expenses';
import ExpenseForm from './pages/Expenses/ExpenseForm';
import ExpenseDetails from './pages/Expenses/ExpenseDetails';
import Approvals from './pages/Approvals/Approvals';
import Users from './pages/Users/Users';
import UserForm from './pages/Users/UserForm';
import Company from './pages/Company/Company';
import Profile from './pages/Profile/Profile';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <NotificationProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses/:id" element={<ExpenseDetails />} />
          <Route path="/expenses/:id/edit" element={<ExpenseForm />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/:id/edit" element={<UserForm />} />
          <Route path="/company" element={<Company />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </NotificationProvider>
  );
}

export default App;
