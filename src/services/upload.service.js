const cloudinary = require("cloudinary").v2;
const { AppError } = require("../middleware/errorHandler");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UploadService {
  constructor() {
    this.allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    this.allowedAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav"];
    this.allowedVideoTypes = ["video/mp4", "video/mpeg", "video/quicktime"];
  }

  async uploadImage(file, folder = "images") {
    if (!file) throw new AppError("No file provided", 400);

    console.log("Uploading image:", {
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new AppError(
        "Invalid file type. Only JPEG, PNG and JPG are allowed",
        400
      );
    }

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `dating_app/${folder}`,
        resource_type: "image",
        quality: "auto",
        fetch_format: "auto",
      });

      console.log("Cloudinary upload result:", {
        url: result.secure_url,
        publicId: result.public_id,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new AppError(
        `Error uploading image: ${error.message || "Unknown error"}`,
        500
      );
    }
  }

  async uploadAudio(file, folder = "audio") {
    if (!file) throw new AppError("No file provided", 400);
    if (!this.allowedAudioTypes.includes(file.mimetype)) {
      throw new AppError(
        "Invalid file type. Only MP3 and WAV are allowed",
        400
      );
    }

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `dating_app/${folder}`,
        resource_type: "video", // Cloudinary uses 'video' for audio files
        audio_codec: "mp3",
        bit_rate: "128k",
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new AppError(
        `Error uploading audio: ${error.message || "Unknown error"}`,
        500
      );
    }
  }

  async uploadVideo(file, folder = "videos") {
    if (!file) throw new AppError("No file provided", 400);
    if (!this.allowedVideoTypes.includes(file.mimetype)) {
      throw new AppError(
        "Invalid file type. Only MP4 and QuickTime are allowed",
        400
      );
    }

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `dating_app/${folder}`,
        resource_type: "video",
        eager: [
          { width: 300, height: 300, crop: "pad", audio_codec: "none" },
          {
            width: 160,
            height: 160,
            crop: "crop",
            gravity: "south",
            audio_codec: "none",
          },
        ],
        eager_async: true,
        eager_notification_url: process.env.API_URL + "/api/upload/notify",
        video_codec: "auto",
        bit_rate: "600k",
        fps: 24,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        thumbnail: result.eager[0].secure_url,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new AppError(
        `Error uploading video: ${error.message || "Unknown error"}`,
        500
      );
    }
  }

  async uploadProfileImages(files, folder = "profiles") {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new AppError("No files provided", 400);
    }

    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder)
      );
      const results = await Promise.all(uploadPromises);

      return results;
    } catch (error) {
      console.error("Profile images upload error:", error);
      throw new AppError(
        `Error uploading profile images: ${error.message || "Unknown error"}`,
        500
      );
    }
  }

  async deleteFile(publicId) {
    if (!publicId) throw new AppError("No public ID provided", 400);

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("File deletion error:", error);
      throw new AppError(
        `Error deleting file: ${error.message || "Unknown error"}`,
        500
      );
    }
  }

  async deleteMultipleFiles(publicIds) {
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      throw new AppError("No public IDs provided", 400);
    }

    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      console.error("Multiple files deletion error:", error);
      throw new AppError(
        `Error deleting files: ${error.message || "Unknown error"}`,
        500
      );
    }
  }

  // Generate a signed URL for secure file access
  generateSignedUrl(publicId, options = {}) {
    const defaultOptions = {
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    const finalOptions = { ...defaultOptions, ...options };
    return cloudinary.url(publicId, finalOptions);
  }
}

// Export the class instead of an instance
module.exports = UploadService;
