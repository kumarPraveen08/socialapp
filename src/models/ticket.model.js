const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAdminResponse: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Ticket subject is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Ticket description is required"],
    },
    category: {
      type: String,
      required: [true, "Ticket category is required"],
      enum: [
        "account",
        "payment",
        "technical",
        "feature-request",
        "bug-report",
        "other",
      ],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [commentSchema],
    closedAt: Date,
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reopenedAt: Date,
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes
ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ category: 1 });

// Add virtual field for response time
ticketSchema.virtual("responseTime").get(function () {
  if (this.comments && this.comments.length > 0) {
    const firstResponse = this.comments.find(
      (comment) => comment.isAdminResponse
    );
    if (firstResponse) {
      return firstResponse.createdAt - this.createdAt;
    }
  }
  return null;
});

// Add virtual field for resolution time
ticketSchema.virtual("resolutionTime").get(function () {
  if (this.status === "closed" && this.closedAt) {
    return this.closedAt - this.createdAt;
  }
  return null;
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
