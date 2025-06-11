const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "json", "array"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "general",
        "payment",
        "notification",
        "call",
        "chat",
        "commission",
        "app",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    metadata: {
      min: Number,
      max: Number,
      options: Array,
      validation: String,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
settingSchema.index({ category: 1, key: 1 });
settingSchema.index({ isPublic: 1 });

// Static method to get settings by category
settingSchema.statics.getByCategory = async function (
  category,
  isPublic = false
) {
  const query = { category };
  if (isPublic) {
    query.isPublic = true;
  }
  return this.find(query).sort("key");
};

// Static method to get setting value by key
settingSchema.statics.getValueByKey = async function (key) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

// Middleware to validate value based on type
settingSchema.pre("save", function (next) {
  const setting = this;

  switch (setting.type) {
    case "number":
      if (typeof setting.value !== "number") {
        setting.value = Number(setting.value);
      }
      if (
        setting.metadata.min !== undefined &&
        setting.value < setting.metadata.min
      ) {
        throw new Error(
          `Value must be greater than or equal to ${setting.metadata.min}`
        );
      }
      if (
        setting.metadata.max !== undefined &&
        setting.value > setting.metadata.max
      ) {
        throw new Error(
          `Value must be less than or equal to ${setting.metadata.max}`
        );
      }
      break;

    case "boolean":
      setting.value = Boolean(setting.value);
      break;

    case "json":
      if (typeof setting.value === "string") {
        try {
          setting.value = JSON.parse(setting.value);
        } catch (error) {
          throw new Error("Invalid JSON value");
        }
      }
      break;

    case "array":
      if (!Array.isArray(setting.value)) {
        throw new Error("Value must be an array");
      }
      break;
  }

  next();
});

module.exports = mongoose.model("Setting", settingSchema);
