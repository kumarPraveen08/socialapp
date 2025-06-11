const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Call",
    },
    status: {
      type: String,
      enum: ["active", "hidden", "reported"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per user per modal
reviewSchema.index({ user: 1, modal: 1 }, { unique: true });

// Index for faster lookups
reviewSchema.index({ modal: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function (modalId) {
  const stats = await this.aggregate([
    {
      $match: { modal: modalId, status: "active" },
    },
    {
      $group: {
        _id: "$modal",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Modal").findByIdAndUpdate(modalId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      numberOfReviews: stats[0].numReviews,
    });
  } else {
    await mongoose.model("Modal").findByIdAndUpdate(modalId, {
      averageRating: 0,
      numberOfReviews: 0,
    });
  }
};

// Call calculateAverageRating after save
reviewSchema.post("save", function () {
  this.constructor.calculateAverageRating(this.modal);
});

// Call calculateAverageRating before remove
reviewSchema.pre("remove", function () {
  this.constructor.calculateAverageRating(this.modal);
});

module.exports = mongoose.model("Review", reviewSchema);
