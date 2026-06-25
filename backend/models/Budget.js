const mongoose = require('mongoose');
const { CATEGORIES } = require('./Expense');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: CATEGORIES, required: true },
    monthlyLimit: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 0, max: 11 }, // 0-11 (JS month index)
    year: { type: Number, required: true },
    alertThreshold: { type: Number, default: 80 }, // % of limit that triggers an alert email
    alertSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One budget per category per month/year per user
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
