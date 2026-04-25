const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Board', boardSchema);
