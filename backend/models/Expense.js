const mongoose = require('mongoose');

/**
 * Expense Schema for tracking user expenses
 * Includes category validation and date handling
 */
const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
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
      ],
      message: 'Please select a valid category'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [1000000, 'Amount cannot exceed 1,000,000']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Create compound index for efficient querying of user expenses
 * by date range and category
 */
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, date: 1, category: 1 });

/**
 * Virtual for formatted date (YYYY-MM-DD)
 */
expenseSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

/**
 * Ensure virtual fields are serialized
 */
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);
