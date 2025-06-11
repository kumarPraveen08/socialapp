const { Message, ChatSession } = require("../models/chat.model");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");
const { AppError } = require("../middleware/errorHandler");
const cloudinary = require("cloudinary").v2;

// Start or get chat session
exports.startChatSession = async (req, res, next) => {
  try {
    const { modalId } = req.params;

    // Check if modal exists and is available
    const modal = await Modal.findById(modalId);
    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }
    if (modal.status !== "online") {
      return next(new AppError("Modal is not available for chat", 400));
    }

    // Check if user has enough coins
    const user = await User.findById(req.user.id);
    if (user.wallet.balance < modal.pricing.chatPerMinute) {
      return next(new AppError("Insufficient coins balance", 400));
    }

    // Find existing active session or create new one
    let session = await ChatSession.findOne({
      user: req.user.id,
      modal: modalId,
      status: "active",
    });

    if (!session) {
      session = await ChatSession.create({
        user: req.user.id,
        modal: modalId,
        status: "active",
        startTime: new Date(),
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        session,
        coinsPerMinute: modal.pricing.chatPerMinute,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get chat history
exports.getChatHistory = async (req, res, next) => {
  try {
    const { modalId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const sessions = await ChatSession.find({
      user: req.user.id,
      modal: modalId,
    })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("messages");

    // Get total count
    const total = await ChatSession.countDocuments({
      user: req.user.id,
      modal: modalId,
    });

    res.status(200).json({
      status: "success",
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// End chat session
exports.endChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return next(new AppError("Chat session not found", 404));
    }

    if (session.status === "ended") {
      return next(new AppError("Chat session already ended", 400));
    }

    // Calculate duration and coins spent
    const endTime = new Date();
    const duration = Math.ceil((endTime - session.startTime) / 1000); // in seconds
    const modal = await Modal.findById(session.modal);
    const coinsSpent = Math.ceil(duration / 60) * modal.pricing.chatPerMinute;

    // Update session
    session.status = "ended";
    session.endTime = endTime;
    session.duration = duration;
    session.coinsSpent = coinsSpent;
    await session.save();

    // Deduct coins from user
    await User.findByIdAndUpdate(session.user, {
      $inc: { "wallet.balance": -coinsSpent },
    });

    // Add coins to modal (after commission)
    const commission = modal.commission || 20; // Default 20%
    const modalEarnings = Math.floor(coinsSpent * (1 - commission / 100));
    await Modal.findByIdAndUpdate(session.modal, {
      $inc: { "wallet.balance": modalEarnings },
    });

    res.status(200).json({
      status: "success",
      data: {
        session,
        coinsSpent,
        duration,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send message
exports.sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { type, content } = req.body;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return next(new AppError("Chat session not found", 404));
    }

    if (session.status === "ended") {
      return next(
        new AppError("Cannot send message to ended chat session", 400)
      );
    }

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      senderType: req.userType === "user" ? "Modal" : "User",
      receiver: req.userType === "user" ? session.modal : session.user,
      receiverType: req.userType === "user" ? "Modal" : "User",
      type,
      content,
    });

    // Handle image upload
    if (type === "image" && req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "dating-app/chat",
        width: 500,
        crop: "limit",
      });
      message.metadata = { imageUrl: result.secure_url };
      await message.save();
    }

    // Add message to session
    session.messages.push(message._id);
    session.lastMessageAt = new Date();
    await session.save();

    res.status(201).json({
      status: "success",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// Get session messages
exports.getSessionMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const session = await ChatSession.findById(sessionId).populate({
      path: "messages",
      options: {
        sort: "-createdAt",
        skip: (page - 1) * limit,
        limit: parseInt(limit),
      },
    });

    if (!session) {
      return next(new AppError("Chat session not found", 404));
    }

    // Check if user has access to this session
    if (
      session.user.toString() !== req.user.id &&
      session.modal.toString() !== req.user.id
    ) {
      return next(
        new AppError("You do not have access to this chat session", 403)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        session,
        messages: session.messages,
      },
    });
  } catch (error) {
    next(error);
  }
};
