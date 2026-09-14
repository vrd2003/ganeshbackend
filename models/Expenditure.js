const mongoose = require('mongoose');

const expenditureSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      required: [true, 'Expense reason is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least ₹1']
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required']
    },
    receiptUrl: {
      type: String,
      default: null
    },
    receiptFileName: {
      type: String,
      default: null
    },
    receiptFileType: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expenditure', expenditureSchema);
