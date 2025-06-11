const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth.middleware");
const userController = require("../controllers/user.controller");
const { upload } = require("../middleware/upload.middleware");

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo("user"));

// Profile routes
router.get("/profile", userController.getProfile);
router.patch(
  "/profile",
  upload.single("profileImage"),
  userController.updateProfile
);

// Wallet routes
router.get("/wallet", userController.getWallet);

// Favorites routes
router.get("/favorites", userController.getFavorites);
router.post("/favorites/:modalId", userController.toggleFavorite);
router.delete("/favorites/:modalId", userController.toggleFavorite);

// Device token route
router.patch("/device-token", userController.updateDeviceToken);

module.exports = router;
