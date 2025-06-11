const express = require("express");
const router = express.Router();
const transactionController = require("../../controllers/admin/transaction.controller");

// Get all transactions with filters and pagination
router.get("/", transactionController.getAllTransactions);

// Get transaction by ID
router.get("/:id", transactionController.getTransaction);

// Update transaction status
router.patch("/:id/status", transactionController.updateTransactionStatus);

// Get transaction statistics
router.get("/stats/overview", transactionController.getTransactionStats);

// Export transactions (CSV/Excel)
router.get("/export", transactionController.exportTransactions);

// Create manual transaction
router.post("/manual", transactionController.createManualTransaction);

// Get transaction summary by type
router.get(
  "/summary/by-type",
  transactionController.getTransactionSummaryByType
);

// Get transaction summary by date
router.get(
  "/summary/by-date",
  transactionController.getTransactionSummaryByDate
);

module.exports = router;
