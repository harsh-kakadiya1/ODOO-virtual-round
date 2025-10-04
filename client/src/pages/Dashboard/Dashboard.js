import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import ExpenseCategoryChart from '../../components/Charts/ExpenseCategoryChart';
import ExpenseTrendChart from '../../components/Charts/ExpenseTrendChart';
import TimeFilter from '../../components/Charts/TimeFilter';
import { 
  Receipt, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users,
  Eye,
  Plus
} from 'lucide-react';
import { dashboardAPI, formatCurrency, formatDate } from '../../utils/api';
import Money from '../../components/UI/Money';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useNotifications();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, trendsResponse] = await Promise.all([
        dashboardAPI.getStats(selectedPeriod),
        dashboardAPI.getExpenseTrends(selectedPeriod, 'day')
      ]);
      
      setStats(statsResponse.data);
      setTrends(trendsResponse.data.trends);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      const handleExpenseUpdate = () => {
        // Refresh data when expenses are updated
        fetchDashboardData();
      };

      socket.on('new-notification', handleExpenseUpdate);
      
      return () => {
        socket.off('new-notification', handleExpenseUpdate);
      };
    }
  }, [socket, fetchDashboardData]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Expenses',
      value: stats?.totalExpenses || 0,
      change: '+0%',
      changeType: 'neutral',
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      format: 'currency'
    },
    {
      name: 'Total Count',
      value: stats?.totalCount || 0,
      change: '+0%',
      changeType: 'neutral',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      format: 'number'
    },
    {
      name: 'Pending Expenses',
      value: stats?.statusStats?.find(s => s.status === 'pending')?.count || 0,
      change: '+0%',
      changeType: 'neutral',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      format: 'number'
    },
    {
      name: 'Approved Expenses',
      value: stats?.statusStats?.find(s => s.status === 'approved')?.count || 0,
      change: '+0%',
      changeType: 'neutral',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      format: 'number'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
        </div>
        <div className="flex items-center space-x-4">
          <TimeFilter 
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            loading={loading}
          />
          <Link
            to="/expenses/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <div className="flex items-baseline">
                      {stat.format === 'currency' ? (
                        <Money amount={stat.value} currency={user?.company?.currency || 'USD'} />
                      ) : (
                        <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseCategoryChart 
              data={stats?.categoryStats || []} 
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Expense Trends Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Expense Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTrendChart 
              data={trends || []} 
              loading={loading}
              period={selectedPeriod}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Expenses
            </div>
            <Link
              to="/expenses"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              View all
              <Eye className="h-4 w-4 ml-1" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats?.recentExpenses?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentExpenses.map((expense) => (
                <div key={expense._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.employee?.firstName} {expense.employee?.lastName} • {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      <Money amount={expense.amount} currency={expense.currency} />
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent expenses found</p>
              <Link
                to="/expenses/new"
                className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create your first expense
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;