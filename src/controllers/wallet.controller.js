const Wallet = require("../models/wallet.model");
const { AppError } = require("../middleware/errorHandler");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getBalance = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await Wallet.create({
        user: req.user.id,
        balance: 0,
      });
      return res.status(200).json({
        success: true,
        data: {
          balance: newWallet.balance,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    // Get transactions with pagination
    const transactions = wallet.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + limit);

    const total = wallet.transactions.length;

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.addMoney = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      // Minimum amount ₹100
      throw new AppError("Minimum amount should be ₹100", 400);
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `wallet_${req.user.id}_${Date.now()}`,
      payment_capture: 1,
    });

    // Add pending transaction
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: {
          transactions: {
            type: "credit",
            amount,
            description: "Wallet recharge",
            reference: order.id,
            status: "pending",
            metadata: {
              orderId: order.id,
            },
          },
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new AppError("Invalid payment signature", 400);
    }

    // Get payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amount = payment.amount / 100; // Convert from paise to rupees

    // Update wallet balance and transaction status
    const wallet = await Wallet.findOneAndUpdate(
      {
        user: req.user.id,
        "transactions.reference": razorpay_order_id,
      },
      {
        $inc: { balance: amount },
        $set: {
          "transactions.$.status": "completed",
          "transactions.$.metadata.paymentId": razorpay_payment_id,
        },
      },
      { new: true }
    );

    if (!wallet) {
      throw new AppError("Wallet or transaction not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        balance: wallet.balance,
        transaction: wallet.transactions.find(
          (t) => t.reference === razorpay_order_id
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};
