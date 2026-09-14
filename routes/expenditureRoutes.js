const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  createExpenditure,
  getExpenditures,
  getExpenditureById,
  updateExpenditure,
  deleteExpenditure
} = require('../controllers/expenditureController');

router.route('/')
  .post(upload.single('receipt'), createExpenditure)
  .get(getExpenditures);

router.route('/:id')
  .get(getExpenditureById)
  .put(upload.single('receipt'), updateExpenditure)
  .delete(deleteExpenditure);

module.exports = router;
