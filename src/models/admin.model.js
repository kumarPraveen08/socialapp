const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "moderator", "support"],
      default: "admin",
    },
    permissions: [
      {
        type: String,
        enum: [
          "manage_users",
          "manage_modals",
          "manage_transactions",
          "manage_withdrawals",
          "manage_gifts",
          "manage_content",
          "manage_settings",
          "manage_admins",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1 });

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Set passwordChangedAt when password is modified
adminSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // -1s to ensure token is created after password change
  next();
});

// Compare password method
adminSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after token was issued
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Create password reset token
adminSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Check if admin has required permission
adminSchema.methods.hasPermission = function (permission) {
  return this.role === "super-admin" || this.permissions.includes(permission);
};

// Static method to get admin by email
adminSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
