import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 shadow">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg">💰 Expense Tracker</span>
        <Link to="/" className="hover:text-blue-500">
          Dashboard
        </Link>
        <Link to="/expenses" className="hover:text-blue-500">
          Expenses
        </Link>
        <Link to="/budgets" className="hover:text-blue-500">
          Budgets
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
          title="Toggle dark mode"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <span className="text-sm">Hi, {user.name}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
