import React, { useEffect, useState } from 'react';
import api from '../services/api';

const CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Subscriptions',
  'Travel',
  'Other',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function Budget() {
  const now = new Date();
  const [month] = useState(now.getMonth());
  const [year] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ category: 'Food', monthlyLimit: '', alertThreshold: 80 });

  const loadBudgets = async () => {
    const res = await api.get('/budgets', { params: { month, year } });
    setBudgets(res.data);
  };

  useEffect(() => {
    loadBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/budgets', {
      ...form,
      monthlyLimit: Number(form.monthlyLimit),
      alertThreshold: Number(form.alertThreshold),
      month,
      year,
    });
    setForm({ category: 'Food', monthlyLimit: '', alertThreshold: 80 });
    loadBudgets();
  };

  const handleDelete = async (id) => {
    await api.delete(`/budgets/${id}`);
    loadBudgets();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Budget Planning - {MONTH_NAMES[month]} {year}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-wrap gap-3 items-end"
      >
        <label className="block">
          <span className="text-sm">Category</span>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Monthly Limit (₹)</span>
          <input
            type="number"
            name="monthlyLimit"
            value={form.monthlyLimit}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          />
        </label>
        <label className="block">
          <span className="text-sm">Alert at (%)</span>
          <input
            type="number"
            name="alertThreshold"
            value={form.alertThreshold}
            onChange={handleChange}
            min="1"
            max="100"
            className="mt-1 px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600 w-24"
          />
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Set Budget
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => (
          <div key={b._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{b.category}</h3>
              <button onClick={() => handleDelete(b._id)} className="text-red-500 text-sm">
                Remove
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              ₹{b.spent.toFixed(2)} of ₹{b.monthlyLimit.toFixed(2)} used
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  b.percentUsed >= 100 ? 'bg-red-500' : b.percentUsed >= b.alertThreshold ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs mt-1">{b.percentUsed}% used</p>
          </div>
        ))}
        {budgets.length === 0 && <p className="text-gray-500">No budgets set for this month yet.</p>}
      </div>
    </div>
  );
}
