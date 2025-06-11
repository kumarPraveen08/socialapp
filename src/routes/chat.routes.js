const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const chatController = require("../controllers/chat.controller");
const { upload } = require("../middleware/upload.middleware");

// Protect all routes
router.use(protect);

// Chat session routes
router.post("/sessions/:modalId", chatController.startChatSession);
router.get("/sessions/:modalId", chatController.getChatHistory);
router.patch("/sessions/:sessionId/end", chatController.endChatSession);

// Message routes
router.get("/sessions/:sessionId/messages", chatController.getSessionMessages);
router.post(
  "/sessions/:sessionId/messages",
  upload.single("image"),
  chatController.sendMessage
);

module.exports = router;
