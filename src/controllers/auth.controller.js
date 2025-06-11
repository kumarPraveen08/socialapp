const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");
const mockOTPService = require("../services/mockOtp.service");
const { AppError } = require("../middleware/errorHandler");

// Helper function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { phone, type = "sms" } = req.body;

    if (!phone) {
      throw new AppError("Phone number is required", 400);
    }

    // Validate phone number format
    // const phoneRegex = /^\+[1-9]\d{1,14}$/;
    // if (!phoneRegex.test(phone)) {
    //   throw new AppError(
    //     "Invalid phone number format. Use E.164 format: +919876543210",
    //     400
    //   );
    // }

    // Send OTP using mock service
    const result = await mockOTPService.sendOTP(phone, type);

    res.status(200).json({
      success: true,
      message: result.message,
      otp: result.otp,
      // ...(process.env.NODE_ENV === "development" && { otp: result.otp }),
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, role = "user" } = req.body;

    if (!phone || !otp) {
      throw new AppError("Phone and OTP are required", 400);
    }

    // Verify OTP using mock service
    const verificationResult = await mockOTPService.verifyOTP(phone, otp);

    if (!verificationResult.success) {
      throw new AppError("Invalid OTP", 400);
    }

    // Find or create user/modal based on role
    let user;
    if (role === "modal") {
      user = await Modal.findOneAndUpdate(
        { phone },
        { lastActive: new Date() },
        { upsert: true, new: true }
      );
    } else {
      user = await User.findOneAndUpdate(
        { phone },
        { lastActive: new Date() },
        { upsert: true, new: true }
      );
    }

    // Generate JWT token
    const token = generateToken(user._id, role);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, just send success response as client will remove the token
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
