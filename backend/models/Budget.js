const mongoose = require('mongoose');

/**
 * Budget Schema for tracking monthly budget limits and spending
 * Includes automatic month calculation and spending tracking
 */
const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  month: {
    type: String,
    required: [true, 'Month is required'],
    // Format: YYYY-MM (e.g., "2024-01")
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
  },
  limit: {
    type: Number,
    required: [true, 'Budget limit is required'],
    min: [0, 'Budget limit cannot be negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Create compound index for efficient querying of user budgets by month
 */
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

/**
 * Virtual for remaining budget
 */
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.limit - this.spent);
});

/**
 * Virtual for spending percentage
 */
budgetSchema.virtual('spendingPercentage').get(function() {
  if (this.limit === 0) return 0;
  return Math.round((this.spent / this.limit) * 100);
});

/**
 * Virtual for budget status (safe, warning, danger)
 */
budgetSchema.virtual('status').get(function() {
  const percentage = this.spendingPercentage;
  if (percentage >= 90) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'safe';
});

/**
 * Ensure virtual fields are serialized
 */
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

/**
 * Static method to get current month in YYYY-MM format
 */
budgetSchema.statics.getCurrentMonth = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Static method to get month name from YYYY-MM format
 */
budgetSchema.statics.getMonthName = function(monthString) {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

module.exports = mongoose.model('Budget', budgetSchema);
