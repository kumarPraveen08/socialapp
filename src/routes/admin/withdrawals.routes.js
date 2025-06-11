const express = require("express");
const router = express.Router();
const withdrawalController = require("../../controllers/admin/withdrawal.controller");

// Get all withdrawals with filters and pagination
router.get("/", withdrawalController.getAllWithdrawals);

// Get withdrawal by ID
router.get("/:id", withdrawalController.getWithdrawal);

// Update withdrawal status
router.patch("/:id/status", withdrawalController.updateWithdrawalStatus);

// Get withdrawal statistics
router.get("/stats/overview", withdrawalController.getWithdrawalStats);

// Process withdrawal (approve/reject)
router.post("/:id/process", withdrawalController.processWithdrawal);

// Export withdrawals (CSV/Excel)
router.get("/export", withdrawalController.exportWithdrawals);

module.exports = router;
