const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth.middleware");
const giftController = require("../controllers/gift.controller");

// Public routes
router.get("/", giftController.getAllGifts);

// Protected routes
router.use(protect);

// User routes
router.post("/send", restrictTo("user"), giftController.sendGift);
router.get("/history", restrictTo("user"), giftController.getGiftHistory);

// Modal routes
router.get("/received", restrictTo("modal"), giftController.getReceivedGifts);

// ✅ Public dynamic route (must come last)
router.get("/:id", giftController.getGiftById);

module.exports = router;
