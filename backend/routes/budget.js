const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /budget
 * @desc    Set or update monthly budget
 * @access  Private
 */
router.post('/', [
  body('month')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must be in YYYY-MM format'),
  body('limit')
    .isFloat({ min: 0 })
    .withMessage('Budget limit must be a non-negative number')
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
    const { month, limit } = req.body;

    // Use current month if not specified
    const budgetMonth = month || Budget.getCurrentMonth();

    // Check if budget already exists for this month
    let budget = await Budget.findOne({ userId, month: budgetMonth });

    if (budget) {
      // Update existing budget
      budget.limit = limit;
      await budget.save();
    } else {
      // Create new budget
      budget = new Budget({
        userId,
        month: budgetMonth,
        limit
      });
      await budget.save();
    }

    res.json({
      success: true,
      message: 'Budget set successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while setting budget'
    });
  }
});

/**
 * @route   GET /budget
 * @desc    Get budget information for a specific month or current month
 * @access  Private
 */
router.get('/', [
  query('month')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must be in YYYY-MM format')
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
    const { month } = req.query;

    // Use current month if not specified
    const budgetMonth = month || Budget.getCurrentMonth();

    // Get budget for the specified month
    let budget = await Budget.findOne({ userId, month: budgetMonth });

    if (!budget) {
      // Create default budget if none exists
      budget = new Budget({
        userId,
        month: budgetMonth,
        limit: 0,
        spent: 0
      });
      await budget.save();
    }

    // Get month name for display
    const monthName = Budget.getMonthName(budgetMonth);

    res.json({
      success: true,
      data: {
        budget,
        monthName,
        month: budgetMonth
      }
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching budget'
    });
  }
});

/**
 * @route   GET /budget/history
 * @desc    Get budget history for the last 12 months
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user._id;
    const currentMonth = Budget.getCurrentMonth();
    const [currentYear, currentMonthNum] = currentMonth.split('-');

    // Generate array of last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(parseInt(currentYear), parseInt(currentMonthNum) - 1 - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }

    // Get budgets for all months
    const budgets = await Budget.find({
      userId,
      month: { $in: months }
    }).sort({ month: 1 });

    // Create budget map for easy lookup
    const budgetMap = {};
    budgets.forEach(budget => {
      budgetMap[budget.month] = budget;
    });

    // Fill in missing months with default values
    const budgetHistory = months.map(month => {
      if (budgetMap[month]) {
        const budget = budgetMap[month];
        return {
          _id: budget._id,
          month: budget.month,
          limit: budget.limit,
          spent: budget.spent,
          remaining: budget.remaining,
          spendingPercentage: budget.spendingPercentage,
          status: budget.status,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt
        };
      } else {
        return {
          month,
          limit: 0,
          spent: 0,
          remaining: 0,
          spendingPercentage: 0,
          status: 'safe'
        };
      }
    });

    res.json({
      success: true,
      data: {
        budgetHistory,
        months: months.map(month => ({
          month,
          monthName: Budget.getMonthName(month)
        }))
      }
    });
  } catch (error) {
    console.error('Get budget history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching budget history'
    });
  }
});

/**
 * @route   DELETE /budget/:month
 * @desc    Delete budget for a specific month
 * @access  Private
 */
router.delete('/:month', async (req, res) => {
  try {
    const userId = req.user._id;
    const { month } = req.params;

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Use YYYY-MM'
      });
    }

    // Check if budget exists
    const budget = await Budget.findOne({ userId, month });
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found for this month'
      });
    }

    // Delete the budget
    await Budget.findByIdAndDelete(budget._id);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting budget'
    });
  }
});

/**
 * @route   GET /budget/alerts
 * @desc    Get budget alerts for current month
 * @access  Private
 */
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user._id;
    const currentMonth = Budget.getCurrentMonth();

    // Get current month's budget
    const budget = await Budget.findOne({ userId, month: currentMonth });
    
    if (!budget || budget.limit === 0) {
      return res.json({
        success: true,
        data: {
          alerts: [],
          hasAlerts: false
        }
      });
    }

    const alerts = [];
    const spendingPercentage = budget.spendingPercentage;

    // Check for different alert levels
    if (spendingPercentage >= 100) {
      alerts.push({
        type: 'danger',
        message: `You've exceeded your budget by ${Math.abs(budget.remaining).toFixed(2)}!`,
        percentage: spendingPercentage
      });
    } else if (spendingPercentage >= 90) {
      alerts.push({
        type: 'danger',
        message: `You're at ${spendingPercentage}% of your budget. Almost exceeded!`,
        percentage: spendingPercentage
      });
    } else if (spendingPercentage >= 80) {
      alerts.push({
        type: 'warning',
        message: `You're at ${spendingPercentage}% of your budget. Consider slowing down spending.`,
        percentage: spendingPercentage
      });
    } else if (spendingPercentage >= 70) {
      alerts.push({
        type: 'info',
        message: `You're at ${spendingPercentage}% of your budget.`,
        percentage: spendingPercentage
      });
    }

    res.json({
      success: true,
      data: {
        alerts,
        hasAlerts: alerts.length > 0,
        budget: {
          limit: budget.limit,
          spent: budget.spent,
          remaining: budget.remaining,
          spendingPercentage: budget.spendingPercentage,
          status: budget.status
        }
      }
    });
  } catch (error) {
    console.error('Get budget alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching budget alerts'
    });
  }
});

module.exports = router;
