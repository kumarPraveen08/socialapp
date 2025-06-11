const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["basic", "premium", "exclusive", "seasonal"],
      default: "basic",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    coins: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    animation: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
giftSchema.index({ category: 1, isActive: 1 });
giftSchema.index({ isFeatured: 1 });
giftSchema.index({ price: 1 });
giftSchema.index({ coins: 1 });
giftSchema.index({ purchaseCount: -1 });

const Gift = mongoose.model("Gift", giftSchema);

module.exports = Gift;
