const express = require('express');
const { query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /analytics/monthly
 * @desc    Get monthly spending totals for the last 12 months
 * @access  Private
 */
router.get('/monthly', [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { year } = req.query;
    
    // Use current year if not specified
    const targetYear = year || new Date().getFullYear();

    // Generate array of months for the year
    const months = [];
    for (let month = 1; month <= 12; month++) {
      const monthStr = String(month).padStart(2, '0');
      months.push(`${targetYear}-${monthStr}`);
    }

    // Get expenses for each month
    const monthlyData = [];
    
    for (const month of months) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      
      // Get total spent for the month
      const totalSpent = await Expense.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Get budget for the month
      const budget = await Budget.findOne({ userId, month });
      
      const monthData = {
        month,
        monthName: new Date(startDate).toLocaleDateString('en-US', { month: 'long' }),
        year: parseInt(year),
        spent: totalSpent.length > 0 ? totalSpent[0].total : 0,
        budget: budget ? budget.limit : 0,
        remaining: budget ? Math.max(0, budget.limit - (totalSpent.length > 0 ? totalSpent[0].total : 0)) : 0
      };

      monthlyData.push(monthData);
    }

    res.json({
      success: true,
      data: {
        monthlyData,
        year: targetYear,
        totalSpent: monthlyData.reduce((sum, month) => sum + month.spent, 0),
        totalBudget: monthlyData.reduce((sum, month) => sum + month.budget, 0)
      }
    });
  } catch (error) {
    console.error('Monthly analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching monthly analytics'
    });
  }
});

/**
 * @route   GET /analytics/category
 * @desc    Get category-wise spending breakdown
 * @access  Private
 */
router.get('/category', [
  query('month')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must be in YYYY-MM format'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { month, year } = req.query;

    let matchQuery = { userId };

    if (month) {
      // Specific month
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    } else if (year) {
      // Specific year
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    } else {
      // Current month
      const currentMonth = Budget.getCurrentMonth();
      const [currentYear, currentMonthNum] = currentMonth.split('-');
      const startDate = new Date(parseInt(currentYear), parseInt(currentMonthNum) - 1, 1);
      const endDate = new Date(parseInt(currentYear), parseInt(currentMonthNum), 0, 23, 59, 59);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    }

    // Get category-wise spending
    const categoryData = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Calculate total spent
    const totalSpent = categoryData.reduce((sum, category) => sum + category.total, 0);

    // Add percentage to each category
    const categoryBreakdown = categoryData.map(category => ({
      category: category._id,
      amount: category.total,
      count: category.count,
      percentage: totalSpent > 0 ? Math.round((category.total / totalSpent) * 100) : 0
    }));

    // Get time period for display
    let timePeriod;
    if (month) {
      timePeriod = Budget.getMonthName(month);
    } else if (year) {
      timePeriod = year;
    } else {
      timePeriod = Budget.getMonthName(Budget.getCurrentMonth());
    }

    res.json({
      success: true,
      data: {
        categoryBreakdown,
        totalSpent,
        timePeriod,
        totalTransactions: categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0)
      }
    });
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching category analytics'
    });
  }
});

/**
 * @route   GET /analytics/trends
 * @desc    Get spending trends over time
 * @access  Private
 */
router.get('/trends', [
  query('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be weekly, monthly, or yearly'),
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Months must be between 1 and 24')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { period = 'monthly', months = 12 } = req.query;

    const currentDate = new Date();
    const trends = [];

    if (period === 'monthly') {
      // Monthly trends
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        const totalSpent = await Expense.aggregate([
          {
            $match: {
              userId: userId,
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        trends.push({
          period: month,
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          spent: totalSpent.length > 0 ? totalSpent[0].total : 0
        });
      }
    } else if (period === 'weekly') {
      // Weekly trends (last 12 weeks)
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - (i * 7));
        
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const totalSpent = await Expense.aggregate([
          {
            $match: {
              userId: userId,
              date: { $gte: startOfWeek, $lte: endOfWeek }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        trends.push({
          period: `week-${i}`,
          label: `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          spent: totalSpent.length > 0 ? totalSpent[0].total : 0
        });
      }
    }

    res.json({
      success: true,
      data: {
        trends,
        period,
        totalSpent: trends.reduce((sum, trend) => sum + trend.spent, 0),
        averageSpent: trends.length > 0 ? trends.reduce((sum, trend) => sum + trend.spent, 0) / trends.length : 0
      }
    });
  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching trends analytics'
    });
  }
});

/**
 * @route   GET /analytics/summary
 * @desc    Get comprehensive spending summary
 * @access  Private
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const currentMonth = Budget.getCurrentMonth();
    const [currentYear, currentMonthNum] = currentMonth.split('-');
    
    // Current month data
    const startOfMonth = new Date(parseInt(currentYear), parseInt(currentMonthNum) - 1, 1);
    const endOfMonth = new Date(parseInt(currentYear), parseInt(currentMonthNum), 0, 23, 59, 59);
    
    // Get current month expenses
    const currentMonthExpenses = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get current month budget
    const currentBudget = await Budget.findOne({ userId, month: currentMonth });
    
    // Get top spending categories for current month
    const topCategories = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get spending vs previous month
    const previousMonth = new Date(startOfMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const previousMonthExpenses = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: previousMonth, $lte: new Date(startOfMonth.getTime() - 1) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentMonthTotal = currentMonthExpenses.length > 0 ? currentMonthExpenses[0].total : 0;
    const previousMonthTotal = previousMonthExpenses.length > 0 ? previousMonthExpenses[0].total : 0;
    const changePercentage = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        currentMonth: {
          month: currentMonth,
          monthName: Budget.getMonthName(currentMonth),
          spent: currentMonthTotal,
          budget: currentBudget ? currentBudget.limit : 0,
          remaining: currentBudget ? Math.max(0, currentBudget.limit - currentMonthTotal) : 0,
          transactions: currentMonthExpenses.length > 0 ? currentMonthExpenses[0].count : 0
        },
        topCategories,
        comparison: {
          previousMonth: previousMonthTotal,
          changeAmount: currentMonthTotal - previousMonthTotal,
          changePercentage: Math.round(changePercentage * 100) / 100,
          trend: changePercentage > 0 ? 'increase' : changePercentage < 0 ? 'decrease' : 'stable'
        }
      }
    });
  } catch (error) {
    console.error('Summary analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching summary analytics'
    });
  }
});

module.exports = router;
