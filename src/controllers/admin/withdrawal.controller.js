const Withdrawal = require("../../models/withdrawal.model");
const Modal = require("../../models/modal.model");
const Transaction = require("../../models/transaction.model");
const { AppError } = require("../../middleware/errorHandler");
const { Parser } = require("json2csv");

// Get all withdrawals with filters and pagination
exports.getAllWithdrawals = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      status,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
    } = req.query;

    // Build query
    const query = {};

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

    // Search by modal name or bank details
    if (search) {
      const modals = await Modal.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { modal: { $in: modals.map((m) => m._id) } },
        { "bankDetails.accountHolderName": { $regex: search, $options: "i" } },
        { "bankDetails.accountNumber": { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const withdrawals = await Withdrawal.find(query)
      .populate("modal", "name email phone")
      .populate("processedBy", "name")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Withdrawal.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        withdrawals,
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

// Get withdrawal by ID
exports.getWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("modal", "name email phone")
      .populate("processedBy", "name");

    if (!withdrawal) {
      return next(new AppError("Withdrawal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        withdrawal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update withdrawal status
exports.updateWithdrawalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["pending", "processing", "completed", "failed"].includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      {
        status,
        processedBy: req.user.id,
        processedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!withdrawal) {
      return next(new AppError("Withdrawal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        withdrawal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Process withdrawal
exports.processWithdrawal = async (req, res, next) => {
  try {
    const { action, reason, transactionId } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return next(new AppError("Invalid action", 400));
    }

    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return next(new AppError("Withdrawal not found", 404));
    }

    if (withdrawal.status !== "pending") {
      return next(new AppError("Withdrawal has already been processed", 400));
    }

    // Update withdrawal
    withdrawal.status = action === "approve" ? "processing" : "rejected";
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = Date.now();

    if (action === "approve") {
      withdrawal.transactionId = transactionId;
    } else {
      withdrawal.rejectionReason = reason;
    }

    await withdrawal.save();

    // If rejected, refund the amount to modal's wallet
    if (action === "reject") {
      await Modal.findByIdAndUpdate(withdrawal.modal, {
        $inc: { "wallet.balance": withdrawal.amount },
      });

      // Create refund transaction
      await Transaction.create({
        type: "refund",
        amount: withdrawal.amount,
        user: withdrawal.modal,
        reference: `REFUND_${withdrawal._id}`,
        description: `Withdrawal request rejected: ${reason}`,
        status: "completed",
        netAmount: withdrawal.amount,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        withdrawal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get withdrawal statistics
exports.getWithdrawalStats = async (req, res, next) => {
  try {
    const stats = await Withdrawal.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const dailyStats = await Withdrawal.aggregate([
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

// Export withdrawals to CSV
exports.exportWithdrawals = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build query
    const query = {};

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

    const withdrawals = await Withdrawal.find(query)
      .populate("modal", "name email phone")
      .populate("processedBy", "name")
      .sort("-createdAt");

    const fields = [
      "id",
      "amount",
      "status",
      "modal.name",
      "modal.email",
      "modal.phone",
      "bankDetails.accountHolderName",
      "bankDetails.accountNumber",
      "bankDetails.ifscCode",
      "bankDetails.bankName",
      "transactionId",
      "processedBy.name",
      "processedAt",
      "createdAt",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(withdrawals);

    res.header("Content-Type", "text/csv");
    res.attachment(`withdrawals-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
