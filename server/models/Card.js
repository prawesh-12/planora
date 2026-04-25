const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    column: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Column",
      required: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

cardSchema.index({ board: 1, column: 1, order: 1 });
cardSchema.index({ archived: 1 });

module.exports = mongoose.model("Card", cardSchema);
