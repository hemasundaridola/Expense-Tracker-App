const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// @route   GET /api/budgets?month=&year=
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month !== undefined ? Number(req.query.month) : now.getMonth();
    const year = req.query.year !== undefined ? Number(req.query.year) : now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });

    // Calculate amount spent per category for this month/year
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const spendByCategory = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spentMap = {};
    spendByCategory.forEach((s) => (spentMap[s._id] = s.spent));

    const result = budgets.map((b) => ({
      ...b.toObject(),
      spent: spentMap[b.category] || 0,
      percentUsed: b.monthlyLimit > 0 ? Math.round(((spentMap[b.category] || 0) / b.monthlyLimit) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/budgets
router.post('/', async (req, res, next) => {
  try {
    const { category, monthlyLimit, month, year, alertThreshold } = req.body;
    if (!category || monthlyLimit === undefined || month === undefined || year === undefined) {
      return res.status(400).json({ message: 'category, monthlyLimit, month and year are required' });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { monthlyLimit, alertThreshold: alertThreshold ?? 80, $setOnInsert: { alertSent: false } },
      { upsert: true, new: true }
    );

    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/budgets/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
