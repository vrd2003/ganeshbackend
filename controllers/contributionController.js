const Contribution = require('../models/Contribution');

// @desc    Create a new contribution
// @route   POST /api/contributions
exports.createContribution = async (req, res, next) => {
  try {
    const { contributorName, amount, contributionDate } = req.body;

      if (!contributorName?.trim() || amount === undefined || !contributionDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide contributor name, amount, and date'
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1'
      });
    }

    const contribution = await Contribution.create({
      contributorName: contributorName.trim(),
      amount: Number(amount),
      contributionDate
    });

    res.status(201).json({ success: true, data: contribution });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contributions with search, filter, sort
// @route   GET /api/contributions
exports.getContributions = async (req, res, next) => {
  try {
    const { search, startDate, endDate, sortBy, sortOrder } = req.query;
    let query = {};

    // Search by contributor name
    if (search) {
      query.contributorName = { $regex: search, $options: 'i' };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.contributionDate = {};
      if (startDate) query.contributionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.contributionDate.$lte = end;
      }
    }

    // Sort
    let sort = { createdAt: -1 }; // default: newest first
    if (sortBy) {
      sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    const contributions = await Contribution.find(query).sort(sort);

    // Calculate total
    const totalResult = await Contribution.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      count: contributions.length,
      total,
      data: contributions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contribution
// @route   GET /api/contributions/:id
exports.getContributionById = async (req, res, next) => {
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }
    res.json({ success: true, data: contribution });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contribution
// @route   PUT /api/contributions/:id
exports.updateContribution = async (req, res, next) => {
  try {
    const { contributorName, amount, contributionDate } = req.body;

    if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1'
      });
    }

    const contribution = await Contribution.findByIdAndUpdate(
      req.params.id,
      {
        ...(contributorName !== undefined && { contributorName: contributorName.trim() }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(contributionDate !== undefined && { contributionDate })
      },
      { new: true, runValidators: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    res.json({ success: true, data: contribution });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contribution
// @route   DELETE /api/contributions/:id
exports.deleteContribution = async (req, res, next) => {
  try {
    const contribution = await Contribution.findByIdAndDelete(req.params.id);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
