import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ExpenseForm from '../components/ExpenseForm';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadExpenses = async () => {
    const params = { page, limit: 10 };
    if (categoryFilter) params.category = categoryFilter;
    const res = await api.get('/expenses', { params });
    setExpenses(res.data.expenses);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter]);

  const handleAdd = async (values) => {
    await api.post('/expenses', values);
    setShowForm(false);
    loadExpenses();
  };

  const handleUpdate = async (values) => {
    await api.put(`/expenses/${editing._id}`, values);
    setEditing(null);
    loadExpenses();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    loadExpenses();
  };

  const handleExport = async (type) => {
    const res = await api.get(`/export/${type}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setPage(1);
              setCategoryFilter(e.target.value);
            }}
            className="px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">All Categories</option>
            {[
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
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700"
          >
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700"
          >
            Export Excel
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <ExpenseForm
          initialValues={editing}
          onSubmit={editing ? handleUpdate : handleAdd}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b dark:border-gray-700">
              <th className="p-3">Date</th>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Payment</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e._id} className="border-b dark:border-gray-700">
                <td className="p-3">{new Date(e.date).toLocaleDateString()}</td>
                <td className="p-3">
                  {e.title} {e.isRecurring && <span title="Recurring">🔁</span>}
                </td>
                <td className="p-3">{e.category}</td>
                <td className="p-3">{e.paymentMethod}</td>
                <td className="p-3 text-right">₹{e.amount.toFixed(2)}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => setEditing(e)} className="text-blue-500">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(e._id)} className="text-red-500">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-500">
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 rounded border dark:border-gray-600 disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1">
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded border dark:border-gray-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
