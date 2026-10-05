const mongoose = require("mongoose");

const inventoryHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    openingStock: {
      type: Number,
      required: true,
      min: 0,
    },

    unitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    unitsReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    closingStock: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

inventoryHistorySchema.index(
  { product: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "InventoryHistory",
  inventoryHistorySchema
);