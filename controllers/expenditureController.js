const { supabase } = require('../config/db');
const fs = require('fs');
const path = require('path');

const sortableFields = new Set(['amount', 'expenseDate', 'reason', 'createdAt']);

const toClientRecord = (record) => ({
  ...record,
  _id: record.id,
  expenseDate: record.expense_date,
  receiptUrl: record.receipt_url,
  receiptFileName: record.receipt_file_name,
  receiptFileType: record.receipt_file_type
});

const receiptPath = (receiptUrl) => receiptUrl ? path.join(__dirname, '..', receiptUrl) : null;

exports.createExpenditure = async (req, res, next) => {
  try {
    const { reason, amount, expenseDate } = req.body;
    if (!reason?.trim() || amount === undefined || !expenseDate) {
      return res.status(400).json({ success: false, message: 'Please provide expense reason, amount, and date' });
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: 'Amount must be at least ₹1' });
    }

    const expenditureData = {
      reason: reason.trim(),
      amount: Number(amount),
      expense_date: expenseDate
    };
    if (req.file) {
      expenditureData.receipt_url = `/uploads/${req.file.filename}`;
      expenditureData.receipt_file_name = req.file.originalname;
      expenditureData.receipt_file_type = req.file.mimetype;
    }

    const { data, error } = await supabase.from('expenditures').insert(expenditureData).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data: toClientRecord(data) });
  } catch (error) {
    next(error);
  }
};

exports.getExpenditures = async (req, res, next) => {
  try {
    const { search, startDate, endDate, sortBy, sortOrder } = req.query;
    let query = supabase.from('expenditures').select('*');
    if (search) query = query.ilike('reason', `%${search}%`);
    if (startDate) query = query.gte('expense_date', startDate);
    if (endDate) query = query.lte('expense_date', `${endDate}T23:59:59.999Z`);

    const field = sortableFields.has(sortBy) ? sortBy : 'createdAt';
    const column = field === 'expenseDate' ? 'expense_date' : field === 'createdAt' ? 'created_at' : field;
    const { data, error } = await query.order(column, { ascending: sortOrder === 'asc' });
    if (error) throw error;

    const expenditures = (data || []).map(toClientRecord);
    const total = expenditures.reduce((sum, item) => sum + Number(item.amount), 0);
    res.json({ success: true, count: expenditures.length, total, data: expenditures });
  } catch (error) {
    next(error);
  }
};

exports.getExpenditureById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('expenditures').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Expenditure not found' });
    res.json({ success: true, data: toClientRecord(data) });
  } catch (error) {
    next(error);
  }
};

exports.updateExpenditure = async (req, res, next) => {
  try {
    const { reason, amount, expenseDate } = req.body;
    if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) < 1)) {
      return res.status(400).json({ success: false, message: 'Amount must be at least ₹1' });
    }

    const { data: existing, error: findError } = await supabase.from('expenditures').select('*').eq('id', req.params.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: 'Expenditure not found' });

    const updates = {};
    if (reason !== undefined) updates.reason = reason.trim();
    if (amount !== undefined) updates.amount = Number(amount);
    if (expenseDate !== undefined) updates.expense_date = expenseDate;
    if (req.file) {
      const oldFilePath = receiptPath(existing.receipt_url);
      if (oldFilePath && fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      updates.receipt_url = `/uploads/${req.file.filename}`;
      updates.receipt_file_name = req.file.originalname;
      updates.receipt_file_type = req.file.mimetype;
    }

    const { data, error } = await supabase.from('expenditures').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data: toClientRecord(data) });
  } catch (error) {
    next(error);
  }
};

exports.deleteExpenditure = async (req, res, next) => {
  try {
    const { data: existing, error: findError } = await supabase.from('expenditures').select('*').eq('id', req.params.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: 'Expenditure not found' });

    const { error } = await supabase.from('expenditures').delete().eq('id', req.params.id);
    if (error) throw error;
    const filePath = receiptPath(existing.receipt_url);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
