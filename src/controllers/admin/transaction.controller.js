const Transaction = require("../../models/transaction.model");
const { AppError } = require("../../middleware/errorHandler");
const { Parser } = require("json2csv");

exports.getAllTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      type,
      status,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
    } = req.query;

    // Build query
    const query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Search by reference or metadata
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { "metadata.orderId": { $regex: search, $options: "i" } },
        { "metadata.paymentId": { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .populate("user", "name email phone")
      .populate("modal", "name email phone")
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

exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("modal", "name email phone");

    if (!transaction) {
      return next(new AppError("Transaction not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["pending", "completed", "failed", "refunded"].includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return next(new AppError("Transaction not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionStats = async (req, res, next) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        overall: stats,
        daily: dailyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.exportTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, type, status } = req.query;

    // Build query
    const query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate("user", "name email phone")
      .populate("modal", "name email phone")
      .sort("-createdAt");

    const fields = [
      "id",
      "type",
      "amount",
      "status",
      "reference",
      "user.name",
      "user.email",
      "user.phone",
      "modal.name",
      "modal.email",
      "modal.phone",
      "createdAt",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transactions);

    res.header("Content-Type", "text/csv");
    res.attachment(`transactions-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Create manual transaction
exports.createManualTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      user,
      modal,
      description,
      reference = `MANUAL-${Date.now()}`,
    } = req.body;

    if (!type || !amount || !user) {
      return next(
        new AppError("Type, amount and user are required fields", 400)
      );
    }

    if (!["credit", "debit"].includes(type)) {
      return next(new AppError("Type must be either credit or debit", 400));
    }

    const transaction = await Transaction.create({
      type,
      amount,
      user,
      modal,
      description,
      reference,
      status: "completed",
      metadata: {
        createdBy: req.user._id,
        manualTransaction: true,
      },
    });

    await transaction.populate("user", "name email phone");
    if (modal) {
      await transaction.populate("modal", "name email phone");
    }

    res.status(201).json({
      status: "success",
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction summary by type
exports.getTransactionSummaryByType = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const summary = await Transaction.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          type: "$_id",
          count: 1,
          totalAmount: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction summary by date
exports.getTransactionSummaryByDate = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    let dateFormat;
    switch (groupBy) {
      case "hour":
        dateFormat = "%Y-%m-%d-%H";
        break;
      case "day":
        dateFormat = "%Y-%m-%d";
        break;
      case "week":
        dateFormat = "%Y-W%V";
        break;
      case "month":
        dateFormat = "%Y-%m";
        break;
      case "year":
        dateFormat = "%Y";
        break;
      default:
        dateFormat = "%Y-%m-%d";
    }

    const summary = await Transaction.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          transactions: {
            $push: {
              type: "$_id.type",
              count: "$count",
              totalAmount: "$totalAmount",
            },
          },
        },
      },
      {
        $project: {
          date: "$_id",
          transactions: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};
