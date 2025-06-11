const mongoose = require("mongoose");
const { seedUsers, clearUsers } = require("./userSeeder");
const { seedModals, clearModals } = require("./modalSeeder");

const seedAll = async () => {
  try {
    console.log("Starting seeding process...");

    // Seed users
    await seedUsers();

    // Seed modals
    await seedModals();

    console.log("All data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
};

const clearAll = async () => {
  try {
    console.log("Starting clearing process...");

    // Clear users
    await clearUsers();

    // Clear modals
    await clearModals();

    console.log("All data cleared successfully!");
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
};

// If running this file directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dating_app")
    .then(async () => {
      console.log("Connected to MongoDB");

      const action = process.argv[2];

      if (action === "seed") {
        await seedAll();
      } else if (action === "clear") {
        await clearAll();
      } else {
        console.log("Please specify an action: seed or clear");
      }

      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

module.exports = {
  seedAll,
  clearAll,
};
