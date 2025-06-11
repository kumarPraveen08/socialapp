const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const walletController = require("../controllers/wallet.controller");

// Protect all routes
router.use(protect);

// Get wallet balance
router.get("/balance", walletController.getBalance);

// Get transaction history
router.get("/transactions", walletController.getTransactions);

// Add money to wallet
router.post("/add-money", walletController.addMoney);

// Verify payment
router.post("/verify-payment", walletController.verifyPayment);

module.exports = router;
