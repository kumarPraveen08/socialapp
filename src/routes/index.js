const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const modalRoutes = require("./modal.routes");
const chatRoutes = require("./chat.routes");
const callRoutes = require("./call.routes");
const walletRoutes = require("./wallet.routes");
const giftRoutes = require("./gift.routes");
const paymentRoutes = require("./payment.routes");
const adminRoutes = require("./admin.routes");
const supportRoutes = require("./support.routes");
const livestreamRoutes = require("./livestream.routes");
const uploadRoutes = require("./upload.routes");

// Use route modules
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/modals", modalRoutes);
router.use("/chat", chatRoutes);
router.use("/calls", callRoutes);
router.use("/wallet", walletRoutes);
router.use("/gifts", giftRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);
router.use("/support", supportRoutes);
router.use("/livestreams", livestreamRoutes);
router.use("/upload", uploadRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
  });
});

module.exports = router;
