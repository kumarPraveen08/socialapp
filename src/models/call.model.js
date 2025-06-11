const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    modal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Modal",
      required: true,
    },
    type: {
      type: String,
      enum: ["voice", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "ongoing",
        "completed",
        "cancelled",
        "missed",
        "failed",
      ],
      default: "pending",
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
    metadata: {
      roomId: String,
      platform: {
        type: String,
        enum: ["android", "ios", "web"],
      },
      deviceInfo: {
        os: String,
        browser: String,
        device: String,
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
      networkInfo: {
        type: String,
        connectionType: String,
        quality: String,
      },
      callQuality: {
        audioQuality: String,
        videoQuality: String,
        networkQuality: String,
      },
    },
    notes: String,
    cancelReason: String,
    failureReason: String,
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
callSchema.index({ user: 1, createdAt: -1 });
callSchema.index({ modal: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ startTime: 1 });
callSchema.index({ endTime: 1 });
callSchema.index({ "metadata.location": "2dsphere" });

// Update modal stats after call completion
callSchema.post("save", async function () {
  if (this.status === "completed" && this.duration > 0) {
    await this.model("Modal").updateStats(
      this.modal,
      this.duration,
      this.netAmount
    );
  }
});

// Static method to get call stats
callSchema.statics.getStats = async function (modalId, startDate, endDate) {
  const match = {
    status: "completed",
  };

  if (modalId) {
    match.modal = mongoose.Types.ObjectId(modalId);
  }

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        totalDuration: { $sum: "$duration" },
        totalAmount: { $sum: "$amount" },
        totalCommission: { $sum: "$commission.amount" },
        totalNetAmount: { $sum: "$netAmount" },
        avgDuration: { $avg: "$duration" },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalCalls: 0,
      totalDuration: 0,
      totalAmount: 0,
      totalCommission: 0,
      totalNetAmount: 0,
      avgDuration: 0,
      avgRating: 0,
    }
  );
};

const Call = mongoose.model("Call", callSchema);

module.exports = Call;
