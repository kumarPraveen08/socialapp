const User = require("../../models/user.model");
const Transaction = require("../../models/transaction.model");
const Chat = require("../../models/chat.model");
const Call = require("../../models/call.model");
const Review = require("../../models/review.model");
const { AppError } = require("../../middleware/errorHandler");

// Get all users with filters and pagination
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      isActive,
      isVerified,
      search,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Filter by verification status
    if (isVerified !== undefined) {
      query.isVerified = isVerified === "true";
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-__v");

    // Get total count
    const total = await User.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        users,
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

// Get user by ID
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("wallet.transactions")
      .select("-__v");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    // Remove sensitive fields from update data
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.wallet;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user status (block/unblock)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    await user.remove();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      type,
      status,
    } = req.query;

    // Build query
    const query = { user: req.params.id };

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Transaction.countDocuments(query);

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

// Get user chat history
exports.getUserChats = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({ user: req.params.id })
      .sort("-updatedAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("modal", "name profileImages");

    const total = await Chat.countDocuments({ user: req.params.id });

    res.status(200).json({
      status: "success",
      data: {
        chats,
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

// Get user call history
exports.getUserCalls = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = "-createdAt", status } = req.query;

    // Build query
    const query = { user: req.params.id };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const calls = await Call.find(query)
      .populate("modal", "name profileImages")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Call.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        calls,
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

// Get user reviews
exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = "-createdAt", status } = req.query;

    // Build query
    const query = { user: req.params.id };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const reviews = await Review.find(query)
      .populate("modal", "name")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Review.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        reviews,
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

// Adjust user wallet
exports.adjustUserWallet = async (req, res, next) => {
  try {
    const { amount, type, description } = req.body;

    if (!amount || !type || !["credit", "debit"].includes(type)) {
      return next(
        new AppError("Please provide valid amount and type (credit/debit)", 400)
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: user._id,
      amount: Math.abs(amount),
      type,
      description: description || `Admin ${type} adjustment`,
      status: "completed",
    });

    // Update user wallet
    if (type === "credit") {
      user.wallet.balance += Math.abs(amount);
    } else {
      if (user.wallet.balance < Math.abs(amount)) {
        return next(new AppError("Insufficient wallet balance", 400));
      }
      user.wallet.balance -= Math.abs(amount);
    }

    // Add transaction to user's transactions array
    user.wallet.transactions.push(transaction._id);
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};
