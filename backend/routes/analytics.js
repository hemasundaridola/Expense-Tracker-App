const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// @route   GET /api/analytics/summary
// Returns total spend, this-month spend, last-month spend, average per day
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totals] = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $facet: {
          allTime: [{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }],
          thisMonth: [
            { $match: { date: { $gte: startOfThisMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          lastMonth: [
            { $match: { date: { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
        },
      },
    ]);

    const allTime = totals.allTime[0]?.total || 0;
    const thisMonth = totals.thisMonth[0]?.total || 0;
    const lastMonth = totals.lastMonth[0]?.total || 0;

    res.json({
      totalSpent: allTime,
      totalTransactions: totals.allTime[0]?.count || 0,
      thisMonth,
      lastMonth,
      changeFromLastMonth: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null,
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/analytics/category-wise?month=&year=
router.get('/category-wise', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const match = { user: userId };

    if (req.query.month !== undefined && req.query.year !== undefined) {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      match.date = { $gte: new Date(year, month, 1), $lt: new Date(year, month + 1, 1) };
    }

    const data = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/analytics/monthly-trend?months=6
// Returns total spend per month for the last N months
router.get('/monthly-trend', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const months = Number(req.query.months) || 6;

    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const data = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/analytics/savings?months=6
// Compares spending vs budget limits to estimate "savings" (unused budget)
router.get('/savings', async (req, res, next) => {
  try {
    const Budget = require('../models/Budget');
    const userId = req.user._id;
    const months = Number(req.query.months) || 6;
    const now = new Date();

    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);

      const [spendAgg, budgetAgg] = await Promise.all([
        Expense.aggregate([
          { $match: { user: userId, date: { $gte: start, $lt: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Budget.aggregate([
          { $match: { user: userId, month, year } },
          { $group: { _id: null, total: { $sum: '$monthlyLimit' } } },
        ]),
      ]);

      const spent = spendAgg[0]?.total || 0;
      const budgeted = budgetAgg[0]?.total || 0;

      results.push({
        month,
        year,
        spent,
        budgeted,
        savings: budgeted - spent,
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
