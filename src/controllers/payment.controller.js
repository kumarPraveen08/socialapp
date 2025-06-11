const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const { AppError } = require("../middleware/errorHandler");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get coin plans
exports.getCoinPlans = async (req, res) => {
  const plans = [
    { id: "basic", coins: 100, amount: 99, bonus: 0 },
    { id: "standard", coins: 500, amount: 499, bonus: 50 },
    { id: "premium", coins: 1000, amount: 999, bonus: 150 },
    { id: "ultimate", coins: 2000, amount: 1999, bonus: 400 },
  ];

  res.status(200).json({
    status: "success",
    data: plans,
  });
};

// Create payment order
exports.createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;

    // Get plan details
    const plans = {
      basic: { coins: 100, amount: 99, bonus: 0 },
      standard: { coins: 500, amount: 499, bonus: 50 },
      premium: { coins: 1000, amount: 999, bonus: 150 },
      ultimate: { coins: 2000, amount: 1999, bonus: 400 },
    };

    const plan = plans[planId];
    if (!plan) {
      return next(new AppError("Invalid plan selected", 400));
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.amount * 100, // amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}_${req.user.id}`,
      notes: {
        userId: req.user.id,
        planId,
        coins: plan.coins,
        bonus: plan.bonus,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        order,
        plan,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return next(new AppError("Invalid payment signature", 400));
    }

    // Get plan details
    const plans = {
      basic: { coins: 100, amount: 99, bonus: 0 },
      standard: { coins: 500, amount: 499, bonus: 50 },
      premium: { coins: 1000, amount: 999, bonus: 150 },
      ultimate: { coins: 2000, amount: 1999, bonus: 400 },
    };

    const plan = plans[planId];
    if (!plan) {
      return next(new AppError("Invalid plan", 400));
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user.id,
      userType: "User",
      type: "credit",
      amount: plan.amount,
      coins: plan.coins + plan.bonus,
      description: `Purchased ${plan.coins} coins with ${plan.bonus} bonus coins`,
      status: "completed",
      paymentMethod: "razorpay",
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    // Update user wallet
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "wallet.balance": plan.coins + plan.bonus },
      $push: { "wallet.transactions": transaction._id },
    });

    res.status(200).json({
      status: "success",
      data: {
        transaction,
        coins: plan.coins + plan.bonus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find({
      user: req.user.id,
      userType: "User",
      type: "credit",
      status: "completed",
    })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Transaction.countDocuments({
      user: req.user.id,
      userType: "User",
      type: "credit",
      status: "completed",
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
