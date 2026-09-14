const { supabase } = require('../config/db');

const mapContribution = (record) => ({
  ...record,
  _id: record.id,
  contributorName: record.contributor_name,
  contributionDate: record.contribution_date
});

const mapExpenditure = (record) => ({
  ...record,
  _id: record.id,
  expenseDate: record.expense_date,
  receiptUrl: record.receipt_url,
  receiptFileName: record.receipt_file_name,
  receiptFileType: record.receipt_file_type
});

exports.getSummary = async (req, res, next) => {
  try {
    const [contributionResult, expenditureResult] = await Promise.all([
      supabase.from('contributions').select('*').order('created_at', { ascending: false }),
      supabase.from('expenditures').select('*').order('created_at', { ascending: false })
    ]);
    if (contributionResult.error) throw contributionResult.error;
    if (expenditureResult.error) throw expenditureResult.error;

    const contributions = contributionResult.data || [];
    const expenditures = expenditureResult.data || [];
    const totalContribution = contributions.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenditure = expenditures.reduce((sum, item) => sum + Number(item.amount), 0);
    const distinctContributors = new Set(contributions.map((item) => item.contributor_name.trim().toLowerCase()));

    res.json({
      success: true,
      data: {
        totalContribution,
        totalExpenditure,
        balance: totalContribution - totalExpenditure,
        totalContributors: distinctContributors.size,
        totalContributionEntries: contributions.length,
        totalExpenditureEntries: expenditures.length,
        recentContributions: contributions.slice(0, 5).map(mapContribution),
        recentExpenditures: expenditures.slice(0, 5).map(mapExpenditure)
      }
    });
  } catch (error) {
    next(error);
  }
};
