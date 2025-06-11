const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    commission: {
      defaultRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 20,
      },
      minRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10,
      },
      maxRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 50,
      },
      withdrawalFee: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 2,
      },
    },
    payment: {
      razorpay: {
        enabled: {
          type: Boolean,
          default: true,
        },
        testMode: {
          type: Boolean,
          default: true,
        },
      },
      minimumDeposit: {
        type: Number,
        required: true,
        min: 1,
        default: 99,
      },
      maximumDeposit: {
        type: Number,
        required: true,
        min: 1,
        default: 10000,
      },
      minimumWithdrawal: {
        type: Number,
        required: true,
        min: 1,
        default: 1000,
      },
      maximumWithdrawal: {
        type: Number,
        required: true,
        min: 1,
        default: 50000,
      },
    },
    app: {
      maintenance: {
        enabled: {
          type: Boolean,
          default: false,
        },
        message: {
          type: String,
          default: "",
        },
      },
      version: {
        android: {
          current: {
            type: String,
            required: true,
            default: "1.0.0",
          },
          minimum: {
            type: String,
            required: true,
            default: "1.0.0",
          },
          forceUpdate: {
            type: Boolean,
            default: false,
          },
        },
        ios: {
          current: {
            type: String,
            required: true,
            default: "1.0.0",
          },
          minimum: {
            type: String,
            required: true,
            default: "1.0.0",
          },
          forceUpdate: {
            type: Boolean,
            default: false,
          },
        },
      },
      chat: {
        ratePerMinute: {
          type: Number,
          required: true,
          min: 1,
          default: 10,
        },
        minimumDuration: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
      call: {
        audio: {
          ratePerMinute: {
            type: Number,
            required: true,
            min: 1,
            default: 20,
          },
          minimumDuration: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
          },
        },
        video: {
          ratePerMinute: {
            type: Number,
            required: true,
            min: 1,
            default: 30,
          },
          minimumDuration: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
          },
        },
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.pre("save", async function (next) {
  const count = await this.constructor.countDocuments();
  if (count > 0 && !this.isModified()) {
    next(new Error("Only one settings document can exist"));
  }
  next();
});

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
