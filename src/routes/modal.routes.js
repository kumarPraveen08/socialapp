const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth.middleware");
const modalController = require("../controllers/modal.controller");
const { upload } = require("../middleware/upload.middleware");

// Public routes
router.get("/", modalController.getAllModals);

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo("modal"));

// Profile routes
router.get("/profile", modalController.getProfile);
router.patch(
  "/profile",
  upload.fields([
    { name: "profileImages", maxCount: 5 },
    { name: "audioBio", maxCount: 1 },
  ]),
  modalController.updateProfile
);

// Status route
router.patch("/status", modalController.updateStatus);

// Wallet and withdrawal routes
router.get("/wallet", modalController.getWallet);
router.post("/withdrawals", modalController.requestWithdrawal);
router.get("/withdrawals", modalController.getWithdrawals);

// Device token route
router.patch("/device-token", modalController.updateDeviceToken);

// Public param route (after protected routes)
router.get("/:id", modalController.getModalById);

module.exports = router;
