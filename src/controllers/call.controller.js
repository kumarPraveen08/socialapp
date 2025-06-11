const { RtcTokenBuilder, Role } = require("agora-token");
const { AppError } = require("../middleware/errorHandler");
const Call = require("../models/call.model");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");

// Helper function to generate Agora token
const generateAgoraToken = (channelName, uid, role = Role.PUBLISHER) => {
  try {
    if (!process.env.AGORA_APP_ID || !process.env.AGORA_APP_CERTIFICATE) {
      throw new AppError("Agora credentials not configured", 500);
    }

    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.build(
      appID,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return {
      token,
      appId: appID,
      channel: channelName,
      uid,
      expiresIn: expirationTimeInSeconds,
    };
  } catch (error) {
    throw new AppError("Error generating Agora token: " + error.message, 500);
  }
};

exports.generateToken = async (req, res, next) => {
  try {
    const { modalId, type } = req.body;
    const userId = req.user.id;

    if (!modalId || !type) {
      throw new AppError("Modal ID and call type are required", 400);
    }

    if (!["audio", "video"].includes(type)) {
      throw new AppError("Invalid call type. Must be audio or video", 400);
    }

    // Check if modal exists
    const modal = await Modal.findById(modalId);
    if (!modal) {
      throw new AppError("Modal not found", 404);
    }

    // Check if user has enough balance
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const ratePerMinute = type === "video" ? modal.videoRate : modal.audioRate;
    const minimumBalance = ratePerMinute * 1; // Minimum 1 minute balance required

    if (user.balance < minimumBalance) {
      throw new AppError("Insufficient balance for call", 400);
    }

    // Generate unique channel name
    const channelName = `call_${userId}_${modalId}_${Date.now()}`;

    // Generate tokens for both user and modal
    const userToken = generateAgoraToken(channelName, userId);
    const modalToken = generateAgoraToken(channelName, modalId);

    // Create call record
    const call = await Call.create({
      user: userId,
      modal: modalId,
      type,
      channel: channelName,
      ratePerMinute,
      status: "initiated",
    });

    res.status(200).json({
      success: true,
      message: "Call tokens generated successfully",
      data: {
        callId: call._id,
        channel: channelName,
        type,
        ratePerMinute,
        userToken: userToken.token,
        modalToken: modalToken.token,
        appId: userToken.appId,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.endCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findById(callId);
    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify call belongs to user or modal
    if (call.user.toString() !== userId && call.modal.toString() !== userId) {
      throw new AppError("Not authorized to end this call", 403);
    }

    // Calculate duration and cost
    const duration = Math.ceil((Date.now() - call.startTime) / (60 * 1000)); // in minutes
    const cost = duration * call.ratePerMinute;

    // Update call record
    call.endTime = new Date();
    call.duration = duration;
    call.cost = cost;
    call.status = "completed";
    await call.save();

    // Deduct balance from user
    if (cost > 0) {
      await User.findByIdAndUpdate(call.user, {
        $inc: { balance: -cost },
      });

      // Add earnings to modal (after platform commission)
      const commission = process.env.PLATFORM_COMMISSION || 20; // 20%
      const modalEarnings = cost * (1 - commission / 100);
      await Modal.findByIdAndUpdate(call.modal, {
        $inc: { earnings: modalEarnings },
      });
    }

    res.status(200).json({
      success: true,
      message: "Call ended successfully",
      data: {
        duration,
        cost,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCallHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const calls = await Call.find({
      $or: [{ user: userId }, { modal: userId }],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name phone")
      .populate("modal", "name phone");

    const total = await Call.countDocuments({
      $or: [{ user: userId }, { modal: userId }],
    });

    res.status(200).json({
      success: true,
      data: {
        calls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
