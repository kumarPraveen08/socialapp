const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/admin.model");
const { AppError } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/email");

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Create and send token response
const createSendToken = (admin, statusCode, res) => {
  const token = signToken(admin._id);

  // Remove password from output
  admin.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      admin,
    },
  });
};

// Login admin
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    // Check if admin exists && password is correct
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // Check if admin is active
    if (!admin.isActive) {
      return next(new AppError("Your account has been deactivated", 401));
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save({ validateBeforeSave: false });

    // Send token
    createSendToken(admin, 200, res);
  } catch (error) {
    next(error);
  }
};

// Protect admin routes
exports.protect = async (req, res, next) => {
  try {
    // Get token and check if it exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Please log in to get access", 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin still exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return next(new AppError("The admin no longer exists", 401));
    }

    // Check if admin changed password after token was issued
    if (admin.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError("Password recently changed! Please log in again", 401)
      );
    }

    // Check if admin is active
    if (!admin.isActive) {
      return next(new AppError("Your account has been deactivated", 401));
    }

    // Grant access to protected route
    req.user = admin;
    next();
  } catch (error) {
    next(error);
  }
};

// Check permissions
exports.restrictTo = (...permissions) => {
  return (req, res, next) => {
    // Check if admin has required permissions
    const hasPermission = permissions.some((permission) =>
      req.user.permissions.includes(permission)
    );

    if (!hasPermission && req.user.role !== "super_admin") {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    // Get admin from collection
    const admin = await Admin.findById(req.user.id).select("+password");

    // Check if posted current password is correct
    if (
      !(await admin.correctPassword(req.body.currentPassword, admin.password))
    ) {
      return next(new AppError("Your current password is wrong", 401));
    }

    // If so, update password
    admin.password = req.body.newPassword;
    await admin.save();

    // Log admin in, send JWT
    createSendToken(admin, 200, res);
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    // Get admin based on posted email
    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      return next(
        new AppError("There is no admin with that email address", 404)
      );
    }

    // Generate random reset token
    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    // Send it to admin's email
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/admin/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: admin.email,
        subject: "Your password reset token (valid for 10 min)",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err) {
      admin.passwordResetToken = undefined;
      admin.passwordResetExpires = undefined;
      await admin.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    // Get admin based on the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // If token has not expired, and there is admin, set the new password
    if (!admin) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    admin.password = req.body.password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    // Log the admin in, send JWT
    createSendToken(admin, 200, res);
  } catch (error) {
    next(error);
  }
};
