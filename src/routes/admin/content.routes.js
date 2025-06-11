const express = require("express");
const router = express.Router();
const contentController = require("../../controllers/admin/content.controller");

// Get all content with filters and pagination
router.get("/", contentController.getAllContent);

// Reorder content
router.patch("/reorder", contentController.reorderContent);

// Get content by ID
router.get("/:id", contentController.getContent);

// Create new content
router.post("/", contentController.createContent);

// Update content
router.patch("/:id", contentController.updateContent);

// Delete content
router.delete("/:id", contentController.deleteContent);

// Toggle content status
router.patch("/:id/status", contentController.toggleContentStatus);

// Get content by type
router.get("/type/:type", contentController.getContentByType);

module.exports = router;
