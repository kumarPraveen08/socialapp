const multer = require("multer");
const { AppError } = require("./errorHandler");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + getExtension(file.mimetype));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profileImage" || file.fieldname === "profileImages") {
    // Allow only images
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Please upload only images", 400), false);
    }
  } else if (file.fieldname === "audioBio") {
    // Allow only audio files
    if (!file.mimetype.startsWith("audio/")) {
      return cb(new AppError("Please upload only audio files", 400), false);
    }
  } else if (file.fieldname === "documents") {
    // Allow images and PDFs for documents
    if (
      !file.mimetype.startsWith("image/") &&
      file.mimetype !== "application/pdf"
    ) {
      return cb(
        new AppError("Please upload only images or PDF files", 400),
        false
      );
    }
  }
  cb(null, true);
};

// Get file extension from mimetype
const getExtension = (mimetype) => {
  switch (mimetype) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "audio/mpeg":
      return ".mp3";
    case "audio/wav":
      return ".wav";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max number of files
  },
});

module.exports = {
  upload,
};
