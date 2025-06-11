const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const UploadService = require("../services/upload.service");

// Create a single instance of the upload service
const uploadService = new UploadService();

// Route to handle single image upload
router.post("/image", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const result = await uploadService.uploadImage(req.file);

    res.status(200).json({
      status: "success",
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    next(error);
  }
});

// Route to handle multiple images upload
router.post(
  "/images",
  protect, // Keep authentication for multiple uploads
  upload.array("files", 5),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No files uploaded",
        });
      }

      const results = await uploadService.uploadProfileImages(req.files);

      res.status(200).json({
        status: "success",
        data: results,
      });
    } catch (error) {
      console.error("Upload error:", error);
      next(error);
    }
  }
);

module.exports = router;
