const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const callController = require("../controllers/call.controller");

// Protect all routes
router.use(protect);

// Generate token for a new call
router.post("/token", callController.generateToken);

// End an ongoing call
router.post("/:callId/end", callController.endCall);

// Get call history
router.get("/history", callController.getCallHistory);

module.exports = router;
