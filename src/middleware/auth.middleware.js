const jwt = require("jsonwebtoken");
const { AppError } = require("./errorHandler");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");

const protect = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user/modal still exists
    let currentUser;
    if (decoded.role === "user") {
      currentUser = await User.findById(decoded.id);
    } else {
      currentUser = await Modal.findById(decoded.id);
    }

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return next(
        new AppError(
          "Your account has been deactivated. Please contact support.",
          401
        )
      );
    }

    // Grant access to protected route
    req.user = currentUser;
    req.userType = decoded.role;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userType)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
