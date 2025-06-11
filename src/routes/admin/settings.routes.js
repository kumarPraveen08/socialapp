const express = require("express");
const router = express.Router();
const settingController = require("../../controllers/admin/setting.controller");

// Get all settings with filters
router.get("/", settingController.getAllSettings);

// Get settings by category
router.get("/category/:category", settingController.getSettingsByCategory);

// Get setting by key
router.get("/key/:key", settingController.getSettingByKey);

// Create new setting
router.post("/", settingController.createSetting);

// Update setting
router.patch("/:id", settingController.updateSetting);

// Delete setting
router.delete("/:id", settingController.deleteSetting);

// Bulk update settings
router.post("/bulk-update", settingController.bulkUpdateSettings);

module.exports = router;
