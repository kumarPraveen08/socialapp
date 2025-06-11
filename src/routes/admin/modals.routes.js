const express = require("express");
const router = express.Router();
const modalController = require("../../controllers/admin/modal.controller");

// Get all modals with filters and pagination
router.get("/", modalController.getAllModals);

// Get modal statistics
router.get("/stats/overview", modalController.getModalStats);

// Get modal by ID
router.get("/:id", modalController.getModal);

// Create new modal
router.post("/", modalController.createModal);

// Update modal
router.patch("/:id", modalController.updateModal);

// Delete modal
router.delete("/:id", modalController.deleteModal);

// Toggle modal status (block/unblock)
router.patch("/:id/status", modalController.toggleModalStatus);

// Toggle modal verification status
router.patch("/:id/verify", modalController.toggleModalVerification);

// Get modal earnings
router.get("/:id/earnings", modalController.getModalEarnings);

// Get modal reviews
router.get("/:id/reviews", modalController.getModalReviews);

// Get modal calls
router.get("/:id/calls", modalController.getModalCalls);

// Get modal chats
router.get("/:id/chats", modalController.getModalChats);

module.exports = router;
