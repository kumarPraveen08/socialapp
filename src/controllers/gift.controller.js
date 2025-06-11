const Gift = require("../models/gift.model");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");
const Transaction = require("../models/transaction.model");
const { AppError } = require("../middleware/errorHandler");

// Get all gifts
exports.getAllGifts = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    const gifts = await Gift.find(query).sort("coins");

    res.status(200).json({
      status: "success",
      data: gifts,
    });
  } catch (error) {
    next(error);
  }
};

// Get gift by ID
exports.getGiftById = async (req, res, next) => {
  try {
    const gift = await Gift.findById(req.params.id);

    if (!gift || !gift.isActive) {
      return next(new AppError("Gift not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: gift,
    });
  } catch (error) {
    next(error);
  }
};

// Send gift
exports.sendGift = async (req, res, next) => {
  try {
    const { giftId, modalId, sessionId } = req.body;

    // Check if gift exists and is active
    const gift = await Gift.findById(giftId);
    if (!gift || !gift.isActive) {
      return next(new AppError("Gift not found or unavailable", 404));
    }

    // Check if modal exists
    const modal = await Modal.findById(modalId);
    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    // Check if user has enough coins
    const user = await User.findById(req.user.id);
    if (user.wallet.balance < gift.coins) {
      return next(new AppError("Insufficient coins balance", 400));
    }

    // Create transaction for gift
    const transaction = await Transaction.create({
      user: req.user.id,
      userType: "User",
      type: "gift_payment",
      amount: gift.coins,
      netAmount: gift.coins,
      coins: gift.coins,
      description: `Sent ${gift.name} gift to ${modal.name}`,
      status: "completed",
      paymentMethod: "system",
      modal: modalId,
      metadata: {
        giftId: gift._id,
        modalId,
        sessionId,
      },
      reference: "gift_payment_system",
    });

    // Deduct coins from user
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "wallet.balance": -gift.coins },
      $push: { "wallet.transactions": transaction._id },
    });

    // Add coins to modal (after commission)
    const commission = modal.commission.percentage || 20; // Default 20%
    const modalEarnings = Math.floor(gift.coins * (1 - commission / 100));
    console.log(commission, modalEarnings);
    await Modal.findByIdAndUpdate(modalId, {
      $inc: { "wallet.balance": modalEarnings },
      $push: { "wallet.transactions": transaction._id },
    });

    res.status(200).json({
      status: "success",
      data: {
        transaction,
        gift,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get gift history
exports.getGiftHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find({
      user: req.user.id,
      "metadata.giftId": { $exists: true },
    })
      .populate("metadata.giftId")
      .populate("modal", "name profileImages")
      .lean()
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Transaction.countDocuments({
      user: req.user.id,
      "metadata.giftId": { $exists: true },
    });

    res.status(200).json({
      status: "success",
      data: {
        transactions,
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

// Get received gifts (for modals)
exports.getReceivedGifts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find({
      modal: req.user.id,
      "metadata.giftId": { $exists: true },
    })
      .populate("metadata.giftId")
      .populate("user", "name profileImage")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Transaction.countDocuments({
      modal: req.user.id,
      "metadata.giftId": { $exists: true },
    });

    res.status(200).json({
      status: "success",
      data: {
        transactions,
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
