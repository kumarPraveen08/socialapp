const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderType",
      required: true,
    },
    senderType: {
      type: String,
      required: true,
      enum: ["User", "Modal"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receiverType",
      required: true,
    },
    receiverType: {
      type: String,
      required: true,
      enum: ["User", "Modal"],
    },
    type: {
      type: String,
      enum: ["text", "image", "gift"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      giftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gift",
      },
      imageUrl: String,
      coins: Number,
    },
    readAt: Date,
    deliveredAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const chatSessionSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    duration: Number, // in seconds
    coinsSpent: {
      type: Number,
      default: 0,
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    lastMessageAt: Date,
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
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: 1 });

chatSessionSchema.index({ user: 1, modal: 1 });
chatSessionSchema.index({ status: 1 });
chatSessionSchema.index({ lastMessageAt: 1 });

const Message = mongoose.model("Message", messageSchema);
const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = {
  Message,
  ChatSession,
};
