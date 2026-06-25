const express = require('express');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// @route   GET /api/expenses
// Supports query params: category, startDate, endDate, page, limit, sort
router.get('/', async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20, sort = '-date' } = req.query;

    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Expense.countDocuments(filter),
    ]);

    res.json({
      expenses,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/expenses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/expenses
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      amount,
      category,
      description,
      paymentMethod,
      date,
      isRecurring,
      recurringFrequency,
    } = req.body;

    if (!title || amount === undefined) {
      return res.status(400).json({ message: 'Title and amount are required' });
    }

    let nextRecurringDate = null;
    if (isRecurring && recurringFrequency) {
      nextRecurringDate = computeNextDate(date ? new Date(date) : new Date(), recurringFrequency);
    }

    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount,
      category,
      description,
      paymentMethod,
      date: date || Date.now(),
      isRecurring: !!isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
      nextRecurringDate,
    });

    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/expenses/:id
router.put('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    Object.assign(expense, req.body);

    if (expense.isRecurring && expense.recurringFrequency) {
      expense.nextRecurringDate = computeNextDate(expense.date, expense.recurringFrequency);
    } else {
      expense.nextRecurringDate = null;
    }

    await expense.save();
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/expenses/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
});

// Helper: compute next occurrence date for recurring expenses
function computeNextDate(date, frequency) {
  const next = new Date(date);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return next;
}

module.exports = router;
