const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    modal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Modal",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    coins: {
      type: Number,
      required: true,
    },
    commission: {
      percentage: {
        type: Number,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        required: true,
      },
      accountNumber: {
        type: String,
        required: true,
      },
      ifscCode: {
        type: String,
        required: true,
      },
      bankName: {
        type: String,
        required: true,
      },
      branch: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
    },
    rejectionReason: String,
    transactionId: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    processedAt: Date,
    metadata: {
      upiId: String,
      paymentMethod: {
        type: String,
        enum: ["bank_transfer", "upi", "other"],
        default: "bank_transfer",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
withdrawalSchema.index({ modal: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ processedAt: 1 });

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

module.exports = Withdrawal;
