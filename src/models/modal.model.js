const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const modalSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    profileImages: [
      {
        url: String,
        isVerified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    audioBio: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    specialities: [
      {
        type: String,
        trim: true,
      },
    ],
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    experience: {
      type: Number,
      min: 0,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    pricing: {
      perMinute: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    status: {
      type: String,
      enum: ["online", "offline", "busy"],
      default: "offline",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    commission: {
      percentage: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      flatFee: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    wallet: {
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      transactions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Transaction",
        },
      ],
      pendingWithdrawals: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Withdrawal",
        },
      ],
    },
    availability: {
      schedule: [
        {
          day: {
            type: String,
            enum: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
          slots: [
            {
              start: String, // HH:mm format
              end: String, // HH:mm format
            },
          ],
        },
      ],
      isOnline: {
        type: Boolean,
        default: false,
      },
      lastSeen: Date,
    },
    stats: {
      totalCalls: {
        type: Number,
        default: 0,
      },
      totalDuration: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      averageCallDuration: {
        type: Number,
        default: 0,
      },
    },
    verification: {
      identity: {
        type: {
          type: String,
          enum: ["aadhar", "pan", "passport"],
        },
        number: String,
        image: String,
        isVerified: {
          type: Boolean,
          default: false,
        },
        verifiedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
      },
      documents: [
        {
          type: {
            type: String,
            enum: ["certificate", "license", "other"],
          },
          title: String,
          image: String,
          isVerified: {
            type: Boolean,
            default: false,
          },
          verifiedAt: Date,
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
          },
        },
      ],
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    documents: {
      idProof: String,
      addressProof: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 1,
    },
    deviceTokens: [
      {
        token: String,
        platform: {
          type: String,
          enum: ["android", "ios", "web"],
        },
      },
    ],
    preferences: {
      notifications: {
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: true,
        },
      },
      autoAcceptCalls: {
        type: Boolean,
        default: false,
      },
      minCallDuration: {
        type: Number,
        default: 5,
        min: 1,
      },
      maxCallDuration: {
        type: Number,
        default: 60,
        min: 1,
      },
      language: {
        type: String,
        default: "en",
      },
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for total earnings
modalSchema.virtual("totalEarnings").get(function () {
  return this.wallet.transactions.reduce((total, transaction) => {
    return total + (transaction.type === "credit" ? transaction.amount : 0);
  }, 0);
});

// Index for searching and filtering
modalSchema.index({ categories: 1, languages: 1, status: 1 });
modalSchema.index({ isFeatured: 1 });

const Modal = mongoose.model("Modal", modalSchema);

module.exports = Modal;
