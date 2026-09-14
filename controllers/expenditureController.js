const Expenditure = require('../models/Expenditure');
const fs = require('fs');
const path = require('path');

// @desc    Create a new expenditure
// @route   POST /api/expenditures
exports.createExpenditure = async (req, res, next) => {
  try {
    const { reason, amount, expenseDate } = req.body;

    if (!reason || !amount || !expenseDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide expense reason, amount, and date'
      });
    }

    if (Number(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1'
      });
    }

    const expenditureData = {
      reason,
      amount: Number(amount),
      expenseDate
    };

    // Handle file upload
    if (req.file) {
      expenditureData.receiptUrl = `/uploads/${req.file.filename}`;
      expenditureData.receiptFileName = req.file.originalname;
      expenditureData.receiptFileType = req.file.mimetype;
    }

    const expenditure = await Expenditure.create(expenditureData);
    res.status(201).json({ success: true, data: expenditure });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenditures with search, filter, sort
// @route   GET /api/expenditures
exports.getExpenditures = async (req, res, next) => {
  try {
    const { search, startDate, endDate, sortBy, sortOrder } = req.query;
    let query = {};

    // Search by reason
    if (search) {
      query.reason = { $regex: search, $options: 'i' };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    // Sort
    let sort = { createdAt: -1 };
    if (sortBy) {
      sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    const expenditures = await Expenditure.find(query).sort(sort);

    // Calculate total
    const totalResult = await Expenditure.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      count: expenditures.length,
      total,
      data: expenditures
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expenditure
// @route   GET /api/expenditures/:id
exports.getExpenditureById = async (req, res, next) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id);
    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found'
      });
    }
    res.json({ success: true, data: expenditure });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expenditure
// @route   PUT /api/expenditures/:id
exports.updateExpenditure = async (req, res, next) => {
  try {
    const { reason, amount, expenseDate } = req.body;

    if (amount !== undefined && Number(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1'
      });
    }

    const updateData = {};
    if (reason !== undefined) updateData.reason = reason;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (expenseDate !== undefined) updateData.expenseDate = expenseDate;

    // Handle new file upload
    if (req.file) {
      // Delete old receipt file if exists
      const oldExpenditure = await Expenditure.findById(req.params.id);
      if (oldExpenditure && oldExpenditure.receiptUrl) {
        const oldFilePath = path.join(__dirname, '..', oldExpenditure.receiptUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      updateData.receiptUrl = `/uploads/${req.file.filename}`;
      updateData.receiptFileName = req.file.originalname;
      updateData.receiptFileType = req.file.mimetype;
    }

    const expenditure = await Expenditure.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found'
      });
    }

    res.json({ success: true, data: expenditure });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expenditure
// @route   DELETE /api/expenditures/:id
exports.deleteExpenditure = async (req, res, next) => {
  try {
    const expenditure = await Expenditure.findByIdAndDelete(req.params.id);
    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found'
      });
    }

    // Delete receipt file if exists
    if (expenditure.receiptUrl) {
      const filePath = path.join(__dirname, '..', expenditure.receiptUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
