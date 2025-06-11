const Livestream = require("../models/livestream.model");
const ChatMessage = require("../models/chat.model");
const Gift = require("../models/gift.model");
const Transaction = require("../models/transaction.model");
const { AppError } = require("../middleware/errorHandler");

// Create a new livestream
exports.createLivestream = async (req, res, next) => {
  try {
    const { title, description, category, isPrivate = false } = req.body;

    if (!title || !category) {
      return next(new AppError("Title and category are required", 400));
    }

    const livestream = await Livestream.create({
      title,
      description,
      category,
      isPrivate,
      host: req.user._id,
      status: "active",
      viewers: [],
      totalViewers: 0,
      totalGifts: 0,
      totalEarnings: 0,
    });

    res.status(201).json({
      status: "success",
      data: {
        livestream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all active livestreams
exports.getActiveLivestreams = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-viewerCount",
      category,
      search,
    } = req.query;

    // Build query
    const query = { status: "active" };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search in title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const livestreams = await Livestream.find(query)
      .populate("host", "name profileImages")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Livestream.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        livestreams,
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

// Get featured livestreams
exports.getFeaturedLivestreams = async (req, res, next) => {
  try {
    const livestreams = await Livestream.find({
      status: "active",
      isFeatured: true,
    })
      .populate("host", "name profileImages")
      .sort("-viewerCount")
      .limit(10);

    res.status(200).json({
      status: "success",
      data: {
        livestreams,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get livestream by ID
exports.getLivestream = async (req, res, next) => {
  try {
    const livestream = await Livestream.findById(req.params.id).populate(
      "host",
      "name profileImages"
    );

    if (!livestream) {
      return next(new AppError("Livestream not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        livestream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update livestream
exports.updateLivestream = async (req, res, next) => {
  try {
    const { title, description, category, isPrivate } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (typeof isPrivate === "boolean") updateData.isPrivate = isPrivate;

    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return next(new AppError("Livestream not found", 404));
    }

    // Check if user is the host
    if (livestream.host.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Not authorized to update this livestream", 403)
      );
    }

    const updatedLivestream = await Livestream.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("host", "name profileImages");

    res.status(200).json({
      status: "success",
      data: {
        livestream: updatedLivestream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// End livestream
exports.endLivestream = async (req, res, next) => {
  try {
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return next(new AppError("Livestream not found", 404));
    }

    // Check if user is the host
    if (livestream.host.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized to end this livestream", 403));
    }

    livestream.status = "ended";
    livestream.endedAt = Date.now();
    await livestream.save();

    res.status(200).json({
      status: "success",
      data: {
        livestream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Join livestream
exports.joinLivestream = async (req, res, next) => {
  try {
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return next(new AppError("Livestream not found", 404));
    }

    if (livestream.status !== "active") {
      return next(new AppError("Livestream is not active", 400));
    }

    // Add viewer if not already in the list
    if (!livestream.viewers.includes(req.user._id)) {
      livestream.viewers.push(req.user._id);
      livestream.totalViewers += 1;
      livestream.viewerCount += 1;
      await livestream.save();
    }

    res.status(200).json({
      status: "success",
      data: {
        livestream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Leave livestream
exports.leaveLivestream = async (req, res, next) => {
  try {
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return next(new AppError("Livestream not found", 404));
    }

    // Remove viewer from the list
    livestream.viewers = livestream.viewers.filter(
      (viewer) => viewer.toString() !== req.user._id.toString()
    );
    livestream.viewerCount = Math.max(0, livestream.viewerCount - 1);
    await livestream.save();

    res.status(200).json({
      status: "success",
      data: {
        livestream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send gift in livestream
exports.sendGift = async (req, res, next) => {
  try {
    const { giftId, quantity = 1 } = req.body;

    if (!giftId) {
      return next(new AppError("Gift ID is required", 400));
    }

    const livestream = await Livestream.findById(req.params.id);
    if (!livestream) {
      return next(new AppError("Livestream not found", 404));
    }

    if (livestream.status !== "active") {
      return next(new AppError("Livestream is not active", 400));
    }

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return next(new AppError("Gift not found", 404));
    }

    const totalAmount = gift.price * quantity;

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      modal: livestream.host,
      type: "gift",
      amount: totalAmount,
      status: "completed",
      metadata: {
        giftId,
        quantity,
        livestreamId: livestream._id,
      },
    });

    // Update livestream statistics
    livestream.totalGifts += quantity;
    livestream.totalEarnings += totalAmount;
    await livestream.save();

    res.status(200).json({
      status: "success",
      data: {
        transaction,
        livestream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get livestream chat messages
exports.getChatMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      livestream: req.params.id,
    })
      .populate("user", "name profileImages")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({
      livestream: req.params.id,
    });

    res.status(200).json({
      status: "success",
      data: {
        messages,
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

// Send chat message
exports.sendChatMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next(new AppError("Message content is required", 400));
    }

    const livestream = await Livestream.findById(req.params.id);
    if (!livestream) {
      return next(new AppError("Livestream not found", 404));
    }

    if (livestream.status !== "active") {
      return next(new AppError("Livestream is not active", 400));
    }

    const message = await ChatMessage.create({
      content,
      user: req.user._id,
      livestream: livestream._id,
    });

    await message.populate("user", "name profileImages");

    res.status(201).json({
      status: "success",
      data: {
        message,
      },
    });
  } catch (error) {
    next(error);
  }
};
