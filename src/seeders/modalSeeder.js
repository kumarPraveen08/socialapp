const Modal = require("../models/modal.model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const dummyModals = [
  {
    name: "Sarah Wilson",
    phone: "1111111111",
    email: "sarah@example.com",
    password: "password123", // Will be hashed before saving
    dateOfBirth: "1995-03-20",
    gender: "female",
    profileImages: [
      {
        url: "https://example.com/sarah1.jpg",
        order: 1,
      },
      {
        url: "https://example.com/sarah2.jpg",
        order: 2,
      },
    ],
    categories: ["chat", "astrology"],
    languages: ["en", "hi"],
    experience: 5,
    audioBio: "https://example.com/sarah-bio.mp3",
    wallet: {
      balance: 5000,
      transactions: [],
    },
    rating: 4.8,
    totalRatings: 120,
    pricing: {
      perMinute: 10,
      currency: "INR",
    },
    status: "online", // Changed from 'active' to match enum
    isVerified: true,
    isOnline: true,
    deviceToken: "modal-device-token-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Emily Brown",
    phone: "2222222222",
    email: "emily@example.com",
    password: "password123", // Will be hashed before saving
    dateOfBirth: "1993-07-12",
    gender: "female",
    profileImages: [
      {
        url: "https://example.com/emily1.jpg",
        order: 1,
      },
      {
        url: "https://example.com/emily2.jpg",
        order: 2,
      },
    ],
    categories: ["chat", "tarot"],
    languages: ["en", "fr"],
    experience: 3,
    audioBio: "https://example.com/emily-bio.mp3",
    wallet: {
      balance: 3500,
      transactions: [],
    },
    rating: 4.6,
    totalRatings: 85,
    pricing: {
      perMinute: 8,
      currency: "INR",
    },
    status: "offline", // Changed from 'active' to match enum
    isVerified: true,
    isOnline: false,
    deviceToken: "modal-device-token-2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Lisa Anderson",
    phone: "3333333333",
    email: "lisa@example.com",
    password: "password123", // Will be hashed before saving
    dateOfBirth: "1991-11-05",
    gender: "female",
    profileImages: [
      {
        url: "https://example.com/lisa1.jpg",
        order: 1,
      },
      {
        url: "https://example.com/lisa2.jpg",
        order: 2,
      },
    ],
    categories: ["chat", "palmistry"],
    languages: ["en", "es"],
    experience: 7,
    audioBio: "https://example.com/lisa-bio.mp3",
    wallet: {
      balance: 7000,
      transactions: [],
    },
    rating: 4.9,
    totalRatings: 200,
    pricing: {
      perMinute: 12,
      currency: "INR",
    },
    status: "online", // Changed from 'active' to match enum
    isVerified: true,
    isOnline: true,
    deviceToken: "modal-device-token-3",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const seedModals = async () => {
  try {
    // Clear existing modals
    await Modal.deleteMany({});

    // Hash passwords for all modals
    const modalsWithHashedPasswords = await Promise.all(
      dummyModals.map(async (modal) => ({
        ...modal,
        password: await hashPassword(modal.password),
      }))
    );

    // Insert dummy modals
    const modals = await Modal.insertMany(modalsWithHashedPasswords);
    console.log("Modals seeded successfully:", modals.length);
    return modals;
  } catch (error) {
    console.error("Error seeding modals:", error);
    throw error;
  }
};

const clearModals = async () => {
  try {
    await Modal.deleteMany({});
    console.log("Modals cleared successfully");
  } catch (error) {
    console.error("Error clearing modals:", error);
    throw error;
  }
};

module.exports = {
  seedModals,
  clearModals,
};
