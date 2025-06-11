const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "wallet_recharge",
        "call_payment",
        "gift_payment",
        "withdrawal",
        "refund",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    modal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Modal",
    },
    reference: {
      type: String,
      required: true,
    },
    description: String,
    metadata: {
      orderId: String,
      paymentId: String,
      callId: mongoose.Schema.Types.ObjectId,
      giftId: mongoose.Schema.Types.ObjectId,
      withdrawalId: String,
      refundId: String,
    },
    commission: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ modal: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ "metadata.orderId": 1 });
transactionSchema.index({ "metadata.paymentId": 1 });

// Pre-save middleware to calculate netAmount if not provided
transactionSchema.pre("save", function (next) {
  if (!this.netAmount) {
    this.netAmount = this.amount - (this.commission || 0) - (this.tax || 0);
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
