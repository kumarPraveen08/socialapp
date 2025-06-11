const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: String,
        reference: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
        metadata: {
          orderId: String,
          paymentId: String,
          callId: mongoose.Schema.Types.ObjectId,
          giftId: mongoose.Schema.Types.ObjectId,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
walletSchema.index({ user: 1 });
walletSchema.index({ "transactions.status": 1 });
walletSchema.index({ "transactions.createdAt": -1 });

module.exports = mongoose.model("Wallet", walletSchema);
