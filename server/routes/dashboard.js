const express = require('express');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build query based on user role
    let query = { 
      company: req.user.company,
      expenseDate: { $gte: startDate }
    };

    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (req.user.role === 'manager') {
      // Manager can see their team's expenses
      const teamEmployees = await User.find({ 
        $or: [
          { manager: req.user._id },
          { _id: req.user._id }
        ],
        company: req.user.company
      }).select('_id');
      
      query.employee = { $in: teamEmployees.map(emp => emp._id) };
    }

    // Get total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountInCompanyCurrency' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get expenses by category
    const categoryStats = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amountInCompanyCurrency' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get expenses by status
    const statusStats = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amountInCompanyCurrency' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily expense trends
    const dailyTrends = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$expenseDate'
            }
          },
          total: { $sum: '$amountInCompanyCurrency' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get recent expenses
    const recentExpenses = await Expense.find(query)
      .populate('employee', 'firstName lastName')
      .sort({ expenseDate: -1 })
      .limit(5);

    res.json({
      period,
      totalExpenses: totalExpenses[0]?.total || 0,
      totalCount: totalExpenses[0]?.count || 0,
      categoryStats: categoryStats.map(cat => ({
        category: cat._id,
        total: cat.total,
        count: cat.count
      })),
      statusStats: statusStats.map(stat => ({
        status: stat._id,
        total: stat.total,
        count: stat.count
      })),
      dailyTrends: dailyTrends.map(trend => ({
        date: trend._id,
        total: trend.total,
        count: trend.count
      })),
      recentExpenses
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/expense-trends
// @desc    Get expense trends for line chart
// @access  Private
router.get('/expense-trends', auth, async (req, res) => {
  try {
    const { period = 'month', groupBy = 'day' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      default:
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }

    // Build query
    let query = { 
      company: req.user.company,
      expenseDate: { $gte: startDate }
    };

    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (req.user.role === 'manager') {
      const teamEmployees = await User.find({ 
        $or: [
          { manager: req.user._id },
          { _id: req.user._id }
        ],
        company: req.user.company
      }).select('_id');
      
      query.employee = { $in: teamEmployees.map(emp => emp._id) };
    }

    // Group by time period
    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%U';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const trends = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$expenseDate'
            }
          },
          total: { $sum: '$amountInCompanyCurrency' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amountInCompanyCurrency' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      period,
      groupBy,
      trends: trends.map(trend => ({
        date: trend._id,
        total: trend.total,
        count: trend.count,
        avgAmount: Math.round(trend.avgAmount * 100) / 100
      }))
    });
  } catch (error) {
    console.error('Expense trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
