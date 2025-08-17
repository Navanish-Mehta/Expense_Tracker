const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /expenses
 * @desc    Add a new expense
 * @access  Private
 */
router.post('/', [
  body('category')
    .isIn([
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Healthcare',
      'Education',
      'Housing',
      'Utilities',
      'Insurance',
      'Travel',
      'Other'
    ])
    .withMessage('Please select a valid category'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
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

    const { category, amount, date, description } = req.body;
    const userId = req.user._id;

    // Create new expense
    const expense = new Expense({
      userId,
      category,
      amount,
      date: date || new Date(),
      description
    });

    await expense.save();

    // Update budget spent amount for the month
    const expenseDate = new Date(expense.date);
    const month = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
    
    await Budget.findOneAndUpdate(
      { userId, month },
      { $inc: { spent: amount } },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding expense'
    });
  }
});

/**
 * @route   GET /expenses
 * @desc    Get user's expenses with optional filters
 * @access  Private
 */
router.get('/', [
  query('category')
    .optional()
    .isIn([
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Healthcare',
      'Education',
      'Housing',
      'Utilities',
      'Insurance',
      'Travel',
      'Other'
    ])
    .withMessage('Invalid category filter'),
  query('month')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month filter must be in YYYY-MM format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
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
    const { category, month, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { userId };
    
    if (category) {
      query.category = category;
    }
    
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching expenses'
    });
  }
});

/**
 * @route   GET /expenses/:id
 * @desc    Get a specific expense by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const expense = await Expense.findOne({ _id: id, userId });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching expense'
    });
  }
});

/**
 * @route   PUT /expenses/:id
 * @desc    Update an existing expense
 * @access  Private
 */
router.put('/:id', [
  body('category')
    .optional()
    .isIn([
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Healthcare',
      'Education',
      'Housing',
      'Utilities',
      'Insurance',
      'Travel',
      'Other'
    ])
    .withMessage('Please select a valid category'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
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

    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    // Find the expense first
    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Calculate amount difference for budget update
    const oldAmount = expense.amount;
    const newAmount = updateData.amount || oldAmount;
    const amountDifference = newAmount - oldAmount;

    // Update the expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update budget if amount changed
    if (amountDifference !== 0) {
      const expenseDate = new Date(updatedExpense.date);
      const month = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      
      await Budget.findOneAndUpdate(
        { userId, month },
        { $inc: { spent: amountDifference } },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense: updatedExpense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating expense'
    });
  }
});

/**
 * @route   DELETE /expenses/:id
 * @desc    Delete an expense
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the expense first
    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Delete the expense
    await Expense.findByIdAndDelete(id);

    // Update budget spent amount
    const expenseDate = new Date(expense.date);
    const month = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
    
    await Budget.findOneAndUpdate(
      { userId, month },
      { $inc: { spent: -expense.amount } }
    );

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting expense'
    });
  }
});

module.exports = router;
