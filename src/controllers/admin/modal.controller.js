const Modal = require("../../models/modal.model");
const Transaction = require("../../models/transaction.model");
const Chat = require("../../models/chat.model");
const Call = require("../../models/call.model");
const Review = require("../../models/review.model");
const { AppError } = require("../../middleware/errorHandler");

// Get all modals with filters and pagination
exports.getAllModals = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      search,
      status,
      isVerified,
      isFeatured,
      category,
      minRating,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {};

    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.isActive = status === "active";
    }

    // Filter by verification status
    if (isVerified !== undefined) {
      query.isVerified = isVerified === "true";
    }

    // Filter by featured status
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === "true";
    }

    // Filter by category
    if (category) {
      query.categories = category;
    }

    // Filter by rating
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const modals = await Modal.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-__v");

    // Get total count
    const total = await Modal.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        modals,
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

// Get modal by ID
exports.getModal = async (req, res, next) => {
  try {
    const modal = await Modal.findById(req.params.id)
      .populate("wallet.transactions")
      .select("-__v");

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        modal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update modal
exports.updateModal = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "profileImages",
      "categories",
      "languages",
      "bio",
      "experience",
    ];
    const updateData = {};

    // Filter allowed fields
    Object.keys(req.body).forEach((field) => {
      if (allowedFields.includes(field)) {
        updateData[field] = req.body[field];
      }
    });

    const modal = await Modal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        modal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle modal status
exports.toggleModalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return next(new AppError("Status must be a boolean", 400));
    }

    const modal = await Modal.findByIdAndUpdate(
      req.params.id,
      { isActive: status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        modal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete modal
exports.deleteModal = async (req, res, next) => {
  try {
    const modal = await Modal.findByIdAndDelete(req.params.id);

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Update modal commission
exports.updateModalCommission = async (req, res, next) => {
  try {
    const { commission } = req.body;

    if (typeof commission !== "number" || commission < 0 || commission > 100) {
      return next(
        new AppError("Commission must be a number between 0 and 100", 400)
      );
    }

    const modal = await Modal.findByIdAndUpdate(
      req.params.id,
      { commission },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        modal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle modal verification status
exports.toggleModalVerification = async (req, res, next) => {
  try {
    const { isVerified } = req.body;

    if (typeof isVerified !== "boolean") {
      return next(new AppError("Verification status must be a boolean", 400));
    }

    const modal = await Modal.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        modal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle modal featured status
exports.toggleModalFeatured = async (req, res, next) => {
  try {
    const { isFeatured } = req.body;

    if (typeof isFeatured !== "boolean") {
      return next(new AppError("Featured status must be a boolean", 400));
    }

    const modal = await Modal.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!modal) {
      return next(new AppError("Modal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        modal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get modal earnings
exports.getModalEarnings = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      user: req.params.id,
      userType: "Modal",
      type: "credit",
      status: "completed",
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort("-createdAt");

    // Calculate total earnings
    const totalEarnings = transactions.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );

    res.status(200).json({
      status: "success",
      data: {
        transactions,
        totalEarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get modal chat history
exports.getModalChats = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({ modal: req.params.id })
      .sort("-updatedAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name profileImage");

    const total = await Chat.countDocuments({ modal: req.params.id });

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

// Get modal call history
exports.getModalCalls = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = { modal: req.params.id };
    if (type) query.type = type;

    const calls = await Call.find(query)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name profileImage");

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

// Get modal reviews
exports.getModalReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, rating } = req.query;

    const query = { modal: req.params.id };
    if (rating) query.rating = parseInt(rating);

    const reviews = await Review.find(query)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name profileImage");

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

// Create new modal
exports.createModal = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      profileImages,
      categories,
      languages,
      bio,
      experience,
      commission = 20, // Default commission rate
    } = req.body;

    // Create new modal
    const modal = await Modal.create({
      name,
      email,
      phone,
      password,
      profileImages,
      categories,
      languages,
      bio,
      experience,
      commission,
      wallet: { balance: 0, transactions: [] },
      isActive: true,
      isVerified: false,
      isFeatured: false,
      rating: 0,
      totalRatings: 0,
      totalCalls: 0,
      totalDuration: 0,
      totalEarnings: 0,
    });

    // Remove password from response
    modal.password = undefined;

    res.status(201).json({
      status: "success",
      data: {
        modal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get modal statistics
exports.getModalStats = async (req, res, next) => {
  try {
    // Get total number of modals
    const totalModals = await Modal.countDocuments();

    // Get active modals
    const activeModals = await Modal.countDocuments({ isActive: true });

    // Get verified modals
    const verifiedModals = await Modal.countDocuments({ isVerified: true });

    // Get featured modals
    const featuredModals = await Modal.countDocuments({ isFeatured: true });

    // Get top rated modals (rating >= 4)
    const topRatedModals = await Modal.countDocuments({ rating: { $gte: 4 } });

    // Get new modals added in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newModals = await Modal.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get total earnings of all modals
    const totalEarnings = await Modal.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalEarnings" },
        },
      },
    ]);

    // Get top performing modals (by earnings)
    const topPerformers = await Modal.find()
      .sort("-totalEarnings")
      .limit(5)
      .select("name totalEarnings rating totalCalls");

    res.status(200).json({
      status: "success",
      data: {
        totalModals,
        activeModals,
        verifiedModals,
        featuredModals,
        topRatedModals,
        newModals,
        totalEarnings: totalEarnings[0]?.total || 0,
        topPerformers,
      },
    });
  } catch (error) {
    next(error);
  }
};
