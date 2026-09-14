const Contribution = require('../models/Contribution');
const Expenditure = require('../models/Expenditure');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
exports.getSummary = async (req, res, next) => {
  try {
    // Get total contribution using aggregation
    const contributionAgg = await Contribution.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Get distinct contributors count
    const distinctContributors = await Contribution.distinct('contributorName');

    // Get total expenditure using aggregation
    const expenditureAgg = await Expenditure.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalContribution = contributionAgg.length > 0 ? contributionAgg[0].total : 0;
    const totalContributionEntries = contributionAgg.length > 0 ? contributionAgg[0].count : 0;
    const totalExpenditure = expenditureAgg.length > 0 ? expenditureAgg[0].total : 0;
    const totalExpenditureEntries = expenditureAgg.length > 0 ? expenditureAgg[0].count : 0;
    const balance = totalContribution - totalExpenditure;

    // Recent records
    const recentContributions = await Contribution.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentExpenditures = await Expenditure.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalContribution,
        totalExpenditure,
        balance,
        totalContributors: distinctContributors.length,
        totalContributionEntries,
        totalExpenditureEntries,
        recentContributions,
        recentExpenditures
      }
    });
  } catch (error) {
    next(error);
  }
};
