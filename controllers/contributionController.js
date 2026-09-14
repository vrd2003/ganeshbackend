const { supabase } = require('../config/db');

const sortableFields = new Set(['amount', 'contributionDate', 'contributorName', 'createdAt']);

const toClientRecord = (record) => ({
  ...record,
  _id: record.id,
  contributorName: record.contributor_name,
  contributionDate: record.contribution_date
});

const validateContribution = ({ contributorName, amount, contributionDate }) => {
  if (!contributorName?.trim() || amount === undefined || !contributionDate) {
    return 'Please provide contributor name, amount, and date';
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) < 1) {
    return 'Amount must be at least ₹1';
  }
  return null;
};

exports.createContribution = async (req, res, next) => {
  try {
    const { contributorName, amount, contributionDate } = req.body;
    const validationError = validateContribution({ contributorName, amount, contributionDate });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { data, error } = await supabase.from('contributions').insert({
      contributor_name: contributorName.trim(),
      amount: Number(amount),
      contribution_date: contributionDate
    }).select().single();
    if (error) throw error;

    res.status(201).json({ success: true, data: toClientRecord(data) });
  } catch (error) {
    next(error);
  }
};

exports.getContributions = async (req, res, next) => {
  try {
    const { search, startDate, endDate, sortBy, sortOrder } = req.query;
    let query = supabase.from('contributions').select('*');

    if (search) query = query.ilike('contributor_name', `%${search}%`);
    if (startDate) query = query.gte('contribution_date', startDate);
    if (endDate) query = query.lte('contribution_date', `${endDate}T23:59:59.999Z`);

    const field = sortableFields.has(sortBy) ? sortBy : 'createdAt';
    const column = field === 'contributorName' ? 'contributor_name' : field === 'contributionDate' ? 'contribution_date' : field === 'createdAt' ? 'created_at' : field;
    const { data, error } = await query.order(column, { ascending: sortOrder === 'asc' });
    if (error) throw error;

    const contributions = (data || []).map(toClientRecord);
    const total = contributions.reduce((sum, item) => sum + Number(item.amount), 0);
    res.json({ success: true, count: contributions.length, total, data: contributions });
  } catch (error) {
    next(error);
  }
};

exports.getContributionById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('contributions').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Contribution not found' });
    res.json({ success: true, data: toClientRecord(data) });
  } catch (error) {
    next(error);
  }
};

exports.updateContribution = async (req, res, next) => {
  try {
    const { contributorName, amount, contributionDate } = req.body;
    if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) < 1)) {
      return res.status(400).json({ success: false, message: 'Amount must be at least ₹1' });
    }

    const updates = {};
    if (contributorName !== undefined) updates.contributor_name = contributorName.trim();
    if (amount !== undefined) updates.amount = Number(amount);
    if (contributionDate !== undefined) updates.contribution_date = contributionDate;

    const { data, error } = await supabase.from('contributions').update(updates).eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Contribution not found' });
    res.json({ success: true, data: toClientRecord(data) });
  } catch (error) {
    next(error);
  }
};

exports.deleteContribution = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('contributions').delete().eq('id', req.params.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Contribution not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
