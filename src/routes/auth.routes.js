const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { validateRequest } = require("../middleware/validateRequest");

// Send OTP
router.post(
  "/send-otp",
  [
    body("phone")
      .notEmpty()
      .matches(/^[0-9]{10}$/)
      .withMessage("Please enter a valid 10-digit phone number"),
    body("role")
      .isIn(["user", "modal"])
      .withMessage("Type must be either user or modal"),
    validateRequest,
  ],
  authController.sendOTP
);

// Verify OTP and Login/Register
router.post(
  "/verify-otp",
  [
    body("phone")
      .notEmpty()
      .matches(/^[0-9]{10}$/)
      .withMessage("Please enter a valid 10-digit phone number"),
    body("otp")
      .notEmpty()
      .matches(/^[0-9]{6}$/)
      .withMessage("Please enter a valid 6-digit OTP"),
    body("role")
      .isIn(["user", "modal"])
      .withMessage("Type must be either user or modal"),
    validateRequest,
  ],
  authController.verifyOTP
);

// Logout
router.post("/logout", authController.logout);

module.exports = router;
