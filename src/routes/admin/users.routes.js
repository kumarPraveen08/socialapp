const express = require("express");
const router = express.Router();
const userController = require("../../controllers/admin/user.controller");

// Get all users with filters and pagination
router.get("/", userController.getAllUsers);

// Get user by ID
router.get("/:id", userController.getUser);

// Update user
router.patch("/:id", userController.updateUser);

// Block/Unblock user
router.patch("/:id/status", userController.toggleUserStatus);

// Delete user
router.delete("/:id", userController.deleteUser);

// Get user transactions
router.get("/:id/transactions", userController.getUserTransactions);

// Get user chat history
router.get("/:id/chats", userController.getUserChats);

// Get user call history
router.get("/:id/calls", userController.getUserCalls);

// Adjust user wallet
router.post("/:id/wallet/adjust", userController.adjustUserWallet);

module.exports = router;
