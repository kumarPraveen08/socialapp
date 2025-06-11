const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "create_admin",
        "update_admin",
        "delete_admin",
        "update_admin_permissions",
        "update_settings",
        "update_commission",
        "update_payment_settings",
        "update_app_settings",
        "block_user",
        "unblock_user",
        "delete_user",
        "adjust_user_wallet",
        "block_modal",
        "unblock_modal",
        "delete_modal",
        "verify_modal",
        "unverify_modal",
        "feature_modal",
        "unfeature_modal",
        "update_modal_commission",
        "approve_withdrawal",
        "reject_withdrawal",
        "create_gift",
        "update_gift",
        "delete_gift",
      ],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    ip: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ action: 1 });

const AdminLog = mongoose.model("AdminLog", adminLogSchema);

module.exports = AdminLog;
