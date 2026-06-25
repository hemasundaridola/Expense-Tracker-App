const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Shared helper to fetch expenses for a date range
async function getExpenses(userId, startDate, endDate) {
  const filter = { user: userId };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  return Expense.find(filter).sort('-date');
}

// @route   GET /api/export/pdf?startDate=&endDate=
router.get('/pdf', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await getExpenses(req.user._id, startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=expense-report.pdf');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text('Expense Report', { align: 'center' });
    doc.fontSize(10).text(`Generated for: ${req.user.name} (${req.user.email})`, { align: 'center' });
    doc.moveDown();

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    doc.fontSize(12).text(`Total Expenses: ${expenses.length}`);
    doc.text(`Total Amount: ${total.toFixed(2)}`);
    doc.moveDown();

    // Table header
    doc.font('Helvetica-Bold');
    doc.text('Date', 40, doc.y, { width: 80, continued: true });
    doc.text('Title', 120, doc.y, { width: 150, continued: true });
    doc.text('Category', 270, doc.y, { width: 100, continued: true });
    doc.text('Amount', 370, doc.y, { width: 80 });
    doc.font('Helvetica');
    doc.moveDown(0.5);

    expenses.forEach((e) => {
      const y = doc.y;
      doc.text(new Date(e.date).toLocaleDateString(), 40, y, { width: 80, continued: true });
      doc.text(e.title, 120, y, { width: 150, continued: true });
      doc.text(e.category, 270, y, { width: 100, continued: true });
      doc.text(e.amount.toFixed(2), 370, y, { width: 80 });
    });

    doc.end();
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/export/excel?startDate=&endDate=
router.get('/excel', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await getExpenses(req.user._id, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Expenses');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Payment Method', key: 'paymentMethod', width: 18 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Description', key: 'description', width: 30 },
    ];

    expenses.forEach((e) => {
      sheet.addRow({
        date: new Date(e.date).toLocaleDateString(),
        title: e.title,
        category: e.category,
        paymentMethod: e.paymentMethod,
        amount: e.amount,
        description: e.description || '',
      });
    });

    sheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expense-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
