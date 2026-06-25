# Personal Expense Tracker (MERN Stack)

A full-stack expense tracker with JWT auth, analytics dashboard, AI-powered insights,
budget planning, recurring expenses, PDF/Excel export, email alerts, and dark mode.

## Project Structure

```
expense-tracker/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── models/                # Mongoose schemas (User, Expense, Budget)
│   ├── routes/                # auth, expenses, budgets, analytics, ai, export
│   ├── middleware/auth.js     # JWT verification + role-based access
│   └── utils/                 # email + cron job for recurring expenses/alerts
└── frontend/
    └── src/
        ├── context/           # Auth & Theme (dark mode) contexts
        ├── pages/              # Login, Register, Dashboard, Expenses, Budget
        ├── components/        # ExpenseForm, Navbar, AIInsights
        └── services/api.js    # Axios instance with JWT interceptor
```

## 1. Prerequisites

- Node.js 18+
- MongoDB (local install or a free MongoDB Atlas cluster)
- An OpenAI or Google Gemini API key (for AI insights — optional but recommended)
- A Gmail account + App Password (for email notifications — optional)

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `OPENAI_API_KEY` or `GEMINI_API_KEY` — for the AI insights feature
- `EMAIL_USER` / `EMAIL_PASS` — Gmail address + App Password for budget alert emails

Run the server:
```bash
npm run dev
```
Server runs at `http://localhost:5000`. Test with `GET http://localhost:5000/api/health`.

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173`. Vite is configured to proxy `/api` to the backend.

## 4. How Each Feature Maps to the Code

| Feature | Where it lives |
|---|---|
| JWT auth + multi-user login + roles | `backend/models/User.js`, `routes/auth.js`, `middleware/auth.js` |
| Analytics dashboard (Chart.js/Recharts) | `frontend/src/pages/Dashboard.jsx` (uses Recharts Pie + Line charts) |
| Category-wise / monthly trend / savings | `backend/routes/analytics.js` (MongoDB aggregation pipelines) |
| AI spending predictions & savings tips | `backend/routes/ai.js` + `frontend/src/components/AIInsights.jsx` |
| Budget planning + alerts | `backend/models/Budget.js`, `routes/budget.js`, `frontend/src/pages/Budget.jsx` |
| Recurring expenses | `Expense.isRecurring/recurringFrequency`, processed by `utils/recurringJob.js` (daily cron) |
| PDF/Excel export | `backend/routes/export.js` (pdfkit + exceljs), buttons in `Expenses.jsx` |
| Email notifications | `backend/utils/sendEmail.js`, triggered from `recurringJob.js` for budget alerts |
| Dark mode | `frontend/src/context/ThemeContext.jsx` + Tailwind `darkMode: 'class'` |

## 5. Step-by-Step Build Order (recommended if learning)

1. **Auth first** — get register/login working end-to-end (User model → auth routes → AuthContext → Login/Register pages). Confirm JWT is stored and sent on requests.
2. **Expense CRUD** — build the Expense model and routes, then the Expenses page (list, add, edit, delete). This is your core data.
3. **Analytics** — once you have expense data, build the aggregation routes (`/analytics/*`) and wire up the Dashboard charts.
4. **Budgets** — add the Budget model/routes and the Budget page with progress bars.
5. **Recurring expenses + cron** — add the `isRecurring` fields and the daily cron job.
6. **Export (PDF/Excel)** — add export routes once you have real expense data to export.
7. **Email alerts** — configure nodemailer and connect it to the budget-check cron job.
8. **AI insights** — last, since it depends on having enough expense history to analyze. Plug in OpenAI or Gemini key.
9. **Dark mode & polish** — Tailwind dark classes are already wired throughout; adjust styling as needed.

## 6. Extending Further

- **Role-based access control**: `middleware/auth.js` already has `authorize('admin')`. Add an admin dashboard route (e.g. view all users' aggregate stats) protected with `protect, authorize('admin')`.
- **Income tracking**: currently this is expense-only. To compute real "savings", add an `Income` model and subtract total expenses from total income per month.
- **Notifications beyond email**: you could add a `/api/notifications` collection and a bell icon in the Navbar.
- **Testing**: add Jest + Supertest for backend routes, and React Testing Library for frontend components.
- **Deployment**: deploy backend to Render/Railway, frontend to Vercel/Netlify, and use MongoDB Atlas for the database. Update `CLIENT_URL` and `VITE` proxy/base URL accordingly.

## 7. Quick Test Flow

1. Register a user via the UI (or `POST /api/auth/register`).
2. Add a few expenses across different categories and dates.
3. Visit the Dashboard — charts should populate.
4. Set a budget for a category, then add expenses until you cross the alert threshold (email alert fires on the next daily cron run, or you can call `checkBudgetAlerts()` manually for testing).
5. Try "Export PDF" / "Export Excel" on the Expenses page.
6. Check the AI Insights panel on the Dashboard (requires `OPENAI_API_KEY` or `GEMINI_API_KEY`).
