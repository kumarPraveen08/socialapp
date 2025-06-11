const Gift = require("../../models/gift.model");
const Transaction = require("../../models/transaction.model");
const { AppError } = require("../../middleware/errorHandler");

exports.getAllGifts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      category,
      isActive,
      isFeatured,
      search,
      minPrice,
      maxPrice,
      minCoins,
      maxCoins,
    } = req.query;

    // Build query
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Filter by featured status
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === "true";
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by coins range
    if (minCoins || maxCoins) {
      query.coins = {};
      if (minCoins) query.coins.$gte = parseInt(minCoins);
      if (maxCoins) query.coins.$lte = parseInt(maxCoins);
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const gifts = await Gift.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Gift.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        gifts,
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

exports.getGift = async (req, res, next) => {
  try {
    const gift = await Gift.findById(req.params.id);

    if (!gift) {
      return next(new AppError("Gift not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        gift,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createGift = async (req, res, next) => {
  try {
    const gift = await Gift.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        gift,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateGift = async (req, res, next) => {
  try {
    const gift = await Gift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!gift) {
      return next(new AppError("Gift not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        gift,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteGift = async (req, res, next) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);

    if (!gift) {
      return next(new AppError("Gift not found", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleGiftStatus = async (req, res, next) => {
  try {
    const gift = await Gift.findById(req.params.id);

    if (!gift) {
      return next(new AppError("Gift not found", 404));
    }

    gift.isActive = !gift.isActive;
    await gift.save();

    res.status(200).json({
      status: "success",
      data: {
        gift,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleGiftFeatured = async (req, res, next) => {
  try {
    const gift = await Gift.findById(req.params.id);

    if (!gift) {
      return next(new AppError("Gift not found", 404));
    }

    gift.isFeatured = !gift.isFeatured;
    await gift.save();

    res.status(200).json({
      status: "success",
      data: {
        gift,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getGiftStats = async (req, res, next) => {
  try {
    const stats = await Gift.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalPurchases: { $sum: "$purchaseCount" },
          totalRevenue: { $sum: "$totalRevenue" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    const topGifts = await Gift.find()
      .sort("-purchaseCount")
      .limit(10)
      .select("name category price coins purchaseCount totalRevenue");

    const recentTransactions = await Transaction.find({ type: "gift_payment" })
      .sort("-createdAt")
      .limit(10)
      .populate("user", "name")
      .populate("modal", "name");

    res.status(200).json({
      status: "success",
      data: {
        categoryStats: stats,
        topGifts,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};
