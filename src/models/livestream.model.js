const mongoose = require("mongoose");

const livestreamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Livestream title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Livestream category is required"],
      enum: ["chat", "talent", "gaming", "dating", "other"],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ended", "banned"],
      default: "active",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    viewerCount: {
      type: Number,
      default: 0,
    },
    totalViewers: {
      type: Number,
      default: 0,
    },
    totalGifts: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    playbackUrl: String,
    thumbnailUrl: String,
    settings: {
      allowChat: {
        type: Boolean,
        default: true,
      },
      allowGifts: {
        type: Boolean,
        default: true,
      },
      minFollowerDays: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes
livestreamSchema.index({ host: 1, status: 1 });
livestreamSchema.index({ status: 1, category: 1 });
livestreamSchema.index({ isFeatured: 1, status: 1 });
livestreamSchema.index({ createdAt: -1 });

// Add virtual field for duration
livestreamSchema.virtual("duration").get(function () {
  if (this.endedAt) {
    return this.endedAt - this.startedAt;
  }
  return Date.now() - this.startedAt;
});

// Pre-save middleware to generate stream key
livestreamSchema.pre("save", function (next) {
  if (!this.streamKey && this.isNew) {
    this.streamKey = `${this.host}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
  next();
});

const Livestream = mongoose.model("Livestream", livestreamSchema);

module.exports = Livestream;
