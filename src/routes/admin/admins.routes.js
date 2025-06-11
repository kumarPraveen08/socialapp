const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/admin.controller");

// Get all admins
router.get("/", adminController.getAllAdmins);

// Get admin by ID
router.get("/:id", adminController.getAdmin);

// Create new admin
router.post("/", adminController.createAdmin);

// Update admin
router.patch("/:id", adminController.updateAdmin);

// Delete admin
router.delete("/:id", adminController.deleteAdmin);

// Update admin permissions
router.patch("/:id/permissions", adminController.updateAdminPermissions);

// Toggle admin status
router.patch("/:id/status", adminController.toggleAdminStatus);

// Get admin activity logs
router.get("/:id/activity", adminController.getAdminActivity);

module.exports = router;
