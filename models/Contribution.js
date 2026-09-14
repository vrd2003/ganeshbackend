const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    contributorName: {
      type: String,
      required: [true, 'Contributor name is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least ₹1']
    },
    contributionDate: {
      type: Date,
      required: [true, 'Contribution date is required']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contribution', contributionSchema);
