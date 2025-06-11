const express = require("express");
const router = express.Router();
const giftController = require("../../controllers/admin/gift.controller");

// Get all gifts with filters and pagination
router.get("/", giftController.getAllGifts);

// Get gift by ID
router.get("/:id", giftController.getGift);

// Create new gift
router.post("/", giftController.createGift);

// Update gift
router.patch("/:id", giftController.updateGift);

// Delete gift
router.delete("/:id", giftController.deleteGift);

// Toggle gift status
router.patch("/:id/status", giftController.toggleGiftStatus);

// Toggle gift featured status
router.patch("/:id/featured", giftController.toggleGiftFeatured);

// Get gift statistics
router.get("/stats/overview", giftController.getGiftStats);

module.exports = router;
