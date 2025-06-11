const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/admin.auth.controller");

// Auth routes (no auth required)
router.post("/login", adminAuthController.login);
router.post("/forgot-password", adminAuthController.forgotPassword);
router.post("/reset-password", adminAuthController.resetPassword);

// Protect all routes after this middleware
router.use(adminAuthController.protect);

// Password change (auth required)
router.post("/change-password", adminAuthController.changePassword);

// User management routes
router.use(
  "/users",
  adminAuthController.restrictTo("manage_users"),
  require("./admin/users.routes")
);

// Modal management routes
router.use(
  "/modals",
  adminAuthController.restrictTo("manage_modals"),
  require("./admin/modals.routes")
);

// Transaction management routes
router.use(
  "/transactions",
  adminAuthController.restrictTo("manage_transactions"),
  require("./admin/transactions.routes")
);

// Withdrawal management routes
router.use(
  "/withdrawals",
  adminAuthController.restrictTo("manage_withdrawals"),
  require("./admin/withdrawals.routes")
);

// Gift management routes
router.use(
  "/gifts",
  adminAuthController.restrictTo("manage_gifts"),
  require("./admin/gifts.routes")
);

// Content management routes
router.use(
  "/content",
  adminAuthController.restrictTo("manage_content"),
  require("./admin/content.routes")
);

// Settings management routes
router.use(
  "/settings",
  adminAuthController.restrictTo("manage_settings"),
  require("./admin/settings.routes")
);

// Admin management routes (super-admin only)
router.use(
  "/admins",
  adminAuthController.restrictTo("manage_admins"),
  require("./admin/admins.routes")
);

module.exports = router;
