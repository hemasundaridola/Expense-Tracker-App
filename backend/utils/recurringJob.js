const cron = require('node-cron');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const User = require('../models/User');
const { sendEmail } = require('./sendEmail');

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

// Create new expense entries for any recurring expense whose nextRecurringDate has passed
async function processRecurringExpenses() {
  const now = new Date();
  const due = await Expense.find({ isRecurring: true, nextRecurringDate: { $lte: now } });

  for (const expense of due) {
    await Expense.create({
      user: expense.user,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      date: expense.nextRecurringDate,
      isRecurring: true,
      recurringFrequency: expense.recurringFrequency,
      nextRecurringDate: computeNextDate(expense.nextRecurringDate, expense.recurringFrequency),
    });

    expense.nextRecurringDate = computeNextDate(expense.nextRecurringDate, expense.recurringFrequency);
    await expense.save();
  }
}

// Check each user's budgets against current spending and email them if over threshold
async function checkBudgetAlerts() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const budgets = await Budget.find({ month, year, alertSent: false });

  for (const budget of budgets) {
    const spendAgg = await Expense.aggregate([
      { $match: { user: budget.user, category: budget.category, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = spendAgg[0]?.total || 0;
    const percent = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;

    if (percent >= budget.alertThreshold) {
      const user = await User.findById(budget.user);
      if (user) {
        await sendEmail(
          user.email,
          `Budget Alert: ${budget.category}`,
          `<p>Hi ${user.name},</p>
           <p>You've used <b>${percent.toFixed(0)}%</b> of your ${budget.category} budget
           (${spent.toFixed(2)} of ${budget.monthlyLimit.toFixed(2)}) this month.</p>
           <p>Consider reviewing your spending in this category.</p>`
        );
      }
      budget.alertSent = true;
      await budget.save();
    }
  }
}

// Schedule jobs: runs once daily at midnight
function startRecurringJob() {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled job: recurring expenses + budget alerts');
    try {
      await processRecurringExpenses();
      await checkBudgetAlerts();
    } catch (err) {
      console.error('Scheduled job error:', err.message);
    }
  });
}

module.exports = { startRecurringJob, processRecurringExpenses, checkBudgetAlerts };
