const Modal = require("../models/modal.model");
const Transaction = require("../models/transaction.model");
const Withdrawal = require("../models/withdrawal.model");
const { AppError } = require("../middleware/errorHandler");
const cloudinary = require("cloudinary").v2;

// Get all modals with filters
exports.getAllModals = async (req, res, next) => {
  try {
    let {
      category,
      language,
      status,
      isFeatured,
      isVerified,
      sort = "-createdAt",
      page = 1,
      limit = 10,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {
      isActive: true,
    };

    if (category) {
      query.categories = { $in: [category] };
    }
    if (language) {
      query.languages = { $in: [language] };
    }
    if (status) {
      query.status = status;
    }
    if (isFeatured) {
      query.isFeatured = ["true", "1"].includes(isFeatured);
    }
    if (isVerified) {
      query.isVerified = ["true", "1"].includes(isVerified);
    }

    const skip = (page - 1) * limit;

    const modals = await Modal.find(query)
      // .select(
      //   "name profileImages status isVerified isFeatured pricing categories languages rating"
      // )
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Modal.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        modals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllModals:", error);
    next(error);
  }
};

// Get modal by ID
exports.getModalById = async (req, res, next) => {
  try {
    const modal = await Modal.findById(req.params.id);

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    if (!modal.isActive) {
      return next(new AppError("This modal is no longer available", 404));
    }

    res.status(200).json({
      status: "success",
      data: modal,
    });
  } catch (error) {
    next(error);
  }
};

// Get modal profile
exports.getProfile = async (req, res, next) => {
  try {
    const modal = await Modal.findById(req.user.id);

    res.status(200).json({
      status: "success",
      data: modal,
    });
  } catch (error) {
    next(error);
  }
};

// Update modal profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "dateOfBirth",
      "gender",
      "categories",
      "languages",
      "experience",
      "pricing",
      "bankDetails",
    ];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Handle profile images upload
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: "dating-app/modals",
          width: 500,
          height: 500,
          crop: "fill",
        })
      );

      const results = await Promise.all(uploadPromises);
      updateData.profileImages = results.map((result) => result.secure_url);
    }

    // Handle audio bio upload
    if (req.files && req.files.audioBio) {
      const result = await cloudinary.uploader.upload(
        req.files.audioBio[0].path,
        {
          folder: "dating-app/modals/audio",
          resource_type: "video",
        }
      );
      updateData.audioBio = result.secure_url;
    }

    const modal = await Modal.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: modal,
    });
  } catch (error) {
    next(error);
  }
};

// Update modal status (online/offline/busy)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["online", "offline", "busy"].includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    await Modal.findByIdAndUpdate(req.user.id, { status });

    res.status(200).json({
      status: "success",
      message: "Status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get wallet balance and earnings
exports.getWallet = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      userType: "Modal",
    })
      .sort("-createdAt")
      .limit(20);

    const pendingWithdrawals = await Withdrawal.find({
      modal: req.user.id,
      status: "pending",
    });

    res.status(200).json({
      status: "success",
      data: {
        balance: req.user.wallet.balance,
        transactions,
        pendingWithdrawals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Request withdrawal
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const modal = await Modal.findById(req.user.id);

    if (!modal.bankDetails || !modal.bankDetails.accountNumber) {
      return next(
        new AppError(
          "Please add bank details before requesting withdrawal",
          400
        )
      );
    }

    if (amount > modal.wallet.balance) {
      return next(new AppError("Insufficient balance", 400));
    }

    const coins = amount * 100; // Assuming 1 coin = ₹1
    const commission = {
      percentage: modal.commission,
      amount: (amount * modal.commission) / 100,
    };

    const withdrawal = await Withdrawal.create({
      modal: req.user.id,
      amount,
      coins,
      commission,
      bankDetails: modal.bankDetails,
      status: "pending",
    });

    // Add to pending withdrawals
    await Modal.findByIdAndUpdate(req.user.id, {
      $push: { "wallet.pendingWithdrawals": withdrawal._id },
    });

    res.status(201).json({
      status: "success",
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

// Get withdrawal history
exports.getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ modal: req.user.id }).sort(
      "-createdAt"
    );

    res.status(200).json({
      status: "success",
      data: withdrawals,
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

    await Modal.findByIdAndUpdate(req.user.id, { deviceToken });

    res.status(200).json({
      status: "success",
      message: "Device token updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
