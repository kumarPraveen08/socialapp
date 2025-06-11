const express = require("express");
const router = express.Router();
const livestreamController = require("../controllers/livestream.controller");
const { protect } = require("../middleware/auth");

// Protect all livestream routes
router.use(protect);

// Create a new livestream
router.post("/", livestreamController.createLivestream);

// Get all active livestreams
router.get("/active", livestreamController.getActiveLivestreams);

// Get featured livestreams
router.get("/featured", livestreamController.getFeaturedLivestreams);

// Get livestream by ID
router.get("/:id", livestreamController.getLivestream);

// Update livestream
router.patch("/:id", livestreamController.updateLivestream);

// End livestream
router.patch("/:id/end", livestreamController.endLivestream);

// Join livestream
router.post("/:id/join", livestreamController.joinLivestream);

// Leave livestream
router.post("/:id/leave", livestreamController.leaveLivestream);

// Send gift in livestream
router.post("/:id/gift", livestreamController.sendGift);

// Get livestream chat messages
router.get("/:id/chat", livestreamController.getChatMessages);

// Send chat message
router.post("/:id/chat", livestreamController.sendChatMessage);

module.exports = router;
