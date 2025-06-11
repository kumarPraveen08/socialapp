const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "faq",
        "privacy_policy",
        "terms_conditions",
        "about_us",
        "help",
        "banner",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      image: String,
      link: String,
      startDate: Date,
      endDate: Date,
      buttonText: String,
      platform: {
        type: String,
        enum: ["all", "android", "ios", "web"],
        default: "all",
      },
    },
    language: {
      type: String,
      default: "en",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
contentSchema.index({ type: 1, language: 1 });
contentSchema.index({ type: 1, isActive: 1 });
contentSchema.index({ type: 1, order: 1 });

module.exports = mongoose.model("Content", contentSchema);
