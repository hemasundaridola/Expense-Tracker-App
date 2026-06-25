import React, { useState } from 'react';

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

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'];

export default function ExpenseForm({ initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initialValues || {
      title: '',
      amount: '',
      category: 'Food',
      description: '',
      paymentMethod: 'Card',
      date: new Date().toISOString().slice(0, 10),
      isRecurring: false,
      recurringFrequency: 'monthly',
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm">Title</span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          />
        </label>
        <label className="block">
          <span className="text-sm">Amount</span>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          />
        </label>
        <label className="block">
          <span className="text-sm">Category</span>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Payment Method</span>
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          >
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Date</span>
          <input
            type="date"
            name="date"
            value={form.date?.slice(0, 10)}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          />
        </label>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" name="isRecurring" checked={form.isRecurring} onChange={handleChange} />
          <span className="text-sm">Recurring expense</span>
        </label>
        {form.isRecurring && (
          <label className="block">
            <span className="text-sm">Frequency</span>
            <select
              name="recurringFrequency"
              value={form.recurringFrequency}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
        )}
      </div>
      <label className="block">
        <span className="text-sm">Description (optional)</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
