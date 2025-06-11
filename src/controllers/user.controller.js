const User = require("../models/user.model");
const Modal = require("../models/modal.model");
const Transaction = require("../models/transaction.model");
const { AppError } = require("../middleware/errorHandler");
const cloudinary = require("cloudinary").v2;

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-__v")
      .populate("favorites", "name profileImages status isVerified isFeatured");

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "dateOfBirth",
      "gender",
      "interests",
      "languages",
    ];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Handle profile image upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "dating-app/users",
        width: 500,
        height: 500,
        crop: "fill",
      });
      updateData.profileImage = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get wallet balance and transactions
exports.getWallet = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
    })
      .sort("-createdAt")
      .limit(20);

    res.status(200).json({
      status: "success",
      data: {
        balance: req.user.wallet.balance,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add/Remove favorite modal
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { modalId } = req.params;

    // Check if modal exists
    const modal = await Modal.findById(modalId);
    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    const user = await User.findById(req.user.id);
    const isFavorite = user.favorites.includes(modalId);

    if (isFavorite) {
      // Remove from favorites
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { favorites: modalId },
      });
    } else {
      // Add to favorites
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { favorites: modalId },
      });
    }

    res.status(200).json({
      status: "success",
      message: isFavorite ? "Removed from favorites" : "Added to favorites",
    });
  } catch (error) {
    next(error);
  }
};

// Get favorite modals
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate(
        "favorites",
        "name profileImages status isVerified isFeatured pricing"
      )
      .lean();

    res.status(200).json({
      status: "success",
      data: user.favorites,
    });
  } catch (error) {
    next(error);
  }
};

// Update device token for notifications
exports.updateDeviceToken = async (req, res, next) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return next(new AppError("Device token is required", 400));
    }

    await User.findByIdAndUpdate(req.user.id, { deviceToken });

    res.status(200).json({
      status: "success",
      message: "Device token updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
