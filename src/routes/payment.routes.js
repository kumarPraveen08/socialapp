const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth.middleware");
const paymentController = require("../controllers/payment.controller");

// Protect all routes
router.use(protect);
router.use(restrictTo("user")); // Only users can make payments

// Payment routes
router.get("/plans", paymentController.getCoinPlans);
router.post("/orders", paymentController.createOrder);
router.post("/verify", paymentController.verifyPayment);
router.get("/history", paymentController.getPaymentHistory);

module.exports = router;
