const express = require('express');
const router = express.Router();
const {
  createContribution,
  getContributions,
  getContributionById,
  updateContribution,
  deleteContribution
} = require('../controllers/contributionController');

router.route('/')
  .post(createContribution)
  .get(getContributions);

router.route('/:id')
  .get(getContributionById)
  .put(updateContribution)
  .delete(deleteContribution);

module.exports = router;
