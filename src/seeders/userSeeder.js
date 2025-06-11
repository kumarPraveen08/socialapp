const User = require("../models/user.model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const dummyUsers = [
  {
    name: "John Doe",
    phone: "1234567890",
    email: "john@example.com",
    password: "password123", // Will be hashed before saving
    dateOfBirth: "1990-01-01",
    gender: "male",
    profileImage: "https://example.com/john.jpg",
    wallet: {
      balance: 1000,
      transactions: [],
    },
    favorites: [],
    deviceToken: "dummy-device-token-1",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Jane Smith",
    phone: "9876543210",
    email: "jane@example.com",
    password: "password123", // Will be hashed before saving
    dateOfBirth: "1992-05-15",
    gender: "female",
    profileImage: "https://example.com/jane.jpg",
    wallet: {
      balance: 2000,
      transactions: [],
    },
    favorites: [],
    deviceToken: "dummy-device-token-2",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Mike Johnson",
    phone: "5555555555",
    email: "mike@example.com",
    password: "password123", // Will be hashed before saving
    dateOfBirth: "1988-12-25",
    gender: "male",
    profileImage: "https://example.com/mike.jpg",
    wallet: {
      balance: 1500,
      transactions: [],
    },
    favorites: [],
    deviceToken: "dummy-device-token-3",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});

    // Hash passwords for all users
    const usersWithHashedPasswords = await Promise.all(
      dummyUsers.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
      }))
    );

    // Insert dummy users
    const users = await User.insertMany(usersWithHashedPasswords);
    console.log("Users seeded successfully:", users.length);
    return users;
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
};

const clearUsers = async () => {
  try {
    await User.deleteMany({});
    console.log("Users cleared successfully");
  } catch (error) {
    console.error("Error clearing users:", error);
    throw error;
  }
};

module.exports = {
  seedUsers,
  clearUsers,
};
