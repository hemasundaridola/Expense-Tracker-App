const express = require('express');
const axios = require('axios');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Build a compact summary of the user's recent expense data to send to the AI model
async function buildExpenseContext(userId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1); // last 6 months

  const monthly = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, category: '$category' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const categoryTotals = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: start } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  return { monthly, categoryTotals };
}

// Call OpenAI or Gemini depending on which API key is configured
async function callAIModel(prompt) {
  if (process.env.OPENAI_API_KEY) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a personal finance assistant. Analyze the spending data and return concise, actionable insights in JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    return response.data.choices[0].message.content;
  }

  if (process.env.GEMINI_API_KEY) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  }

  throw new Error('No AI API key configured (OPENAI_API_KEY or GEMINI_API_KEY)');
}

// @route   GET /api/ai/insights
// Returns AI-generated spending predictions, anomaly detection, and savings suggestions
router.get('/insights', async (req, res, next) => {
  try {
    const { monthly, categoryTotals } = await buildExpenseContext(req.user._id);

    if (categoryTotals.length === 0) {
      return res.json({
        insights:
          'Not enough expense data yet. Add a few expenses across different categories to get personalized AI insights.',
      });
    }

    const prompt = `
Here is a user's expense data for the last 6 months.

Monthly breakdown by category (year, month, category, total amount spent):
${JSON.stringify(monthly)}

Total spent per category over 6 months:
${JSON.stringify(categoryTotals)}

Based on this data, respond ONLY with valid JSON in this exact shape (no markdown, no extra text):
{
  "prediction": "a short sentence predicting next month's likely total spending and which category may dominate",
  "anomalies": ["short bullet describing any category with an unusual spike, or empty array if none"],
  "savingsSuggestions": ["2-4 short, specific, actionable suggestions to reduce spending, e.g. cutting subscriptions or high categories"]
}
`;

    const raw = await callAIModel(prompt);

    // Try to parse JSON from the model response; fall back to raw text
    let parsed;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { prediction: raw, anomalies: [], savingsSuggestions: [] };
    }

    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
