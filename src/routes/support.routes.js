const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");
const { protect } = require("../middleware/auth");

// Protect all support routes
router.use(protect);

// Create support ticket
router.post("/tickets", supportController.createTicket);

// Get all tickets (with filters and pagination)
router.get("/tickets", supportController.getAllTickets);

// Get ticket by ID
router.get("/tickets/:id", supportController.getTicket);

// Update ticket
router.patch("/tickets/:id", supportController.updateTicket);

// Add comment to ticket
router.post("/tickets/:id/comments", supportController.addComment);

// Close ticket
router.patch("/tickets/:id/close", supportController.closeTicket);

// Reopen ticket
router.patch("/tickets/:id/reopen", supportController.reopenTicket);

module.exports = router;
