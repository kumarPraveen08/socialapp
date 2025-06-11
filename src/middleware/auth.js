const jwt = require("jsonwebtoken");
const { AppError } = require("./errorHandler");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError(
        "You are not logged in. Please log in to get access.",
        401
      );
    }

    // 2) Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // 3) Check if user still exists
    let user;
    if (decoded.role === "modal") {
      user = await Modal.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      throw new AppError(
        "The user belonging to this token no longer exists.",
        401
      );
    }

    // 4) Add user and role to request
    req.user = user;
    req.user.id = user._id; // Ensure id is available in both formats
    req.user.role = decoded.role;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      next(new AppError("Invalid token. Please log in again.", 401));
    } else if (error.name === "TokenExpiredError") {
      next(new AppError("Your token has expired. Please log in again.", 401));
    } else {
      next(error);
    }
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
