require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const routes = require("./routes");
const socketHandler = require("./socket");
const { errorHandler } = require("./middleware/errorHandler");
const { getAdminOptions, authenticate } = require("./config/admin.config");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS middleware with credentials
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dating-app")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO setup
socketHandler(io);

// Initialize AdminJS with dynamic imports
const initializeAdmin = async () => {
  const { default: AdminJS } = await import("adminjs");
  const { default: AdminJSExpress } = await import("@adminjs/express");
  const { Database, Resource } = await import("@adminjs/mongoose");

  // Register the mongoose adapter
  AdminJS.registerAdapter({
    Resource,
    Database,
  });

  // Initialize AdminJS with async options
  const adminOptions = await getAdminOptions();

  // Create AdminJS instance
  const admin = new AdminJS(adminOptions);

  // Session configuration
  const ONE_HOUR = 1000 * 60 * 60;
  const sessionConfig = {
    name: "adminjs",
    secret: "supersecret123",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: ONE_HOUR,
      domain: "localhost",
      sameSite: "lax",
    },
  };

  // Use session middleware
  app.use(session(sessionConfig));

  // Add debug middleware
  app.use((req, res, next) => {
    // Only log authentication-related events
    // if (
    //   req.path.includes("/admin/login") ||
    //   req.path === admin.options.rootPath
    // ) {
    //   console.log("\n=== Admin Panel Debug Info ===");
    //   if (req.session?.adminUser) {
    //     console.log("✓ Authenticated Admin:", req.session.adminUser.email);
    //   } else if (req.path.includes("/admin/login")) {
    //     console.log("⌛ Authentication attempt in progress...");
    //   }
    // }
    next();
  });

  // Build authenticated router with inline authentication
  const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        console.log("Authentication attempt:", { email, password });
        if (email === "admin@example.com" && password === "admin123") {
          console.log("Authentication successful");
          return {
            email: "admin@example.com",
            name: "Admin User",
            title: "Admin",
            id: "1",
          };
        }
        console.log("Authentication failed");
        return null;
      },
      cookiePassword: "supersecret123",
    },
    null,
    sessionConfig
  );

  // Use AdminJS router
  app.use(admin.options.rootPath, router);

  return admin;
};

// Start server with AdminJS initialization
const PORT = parseInt(process.env.PORT || "5000");
const MAX_RETRIES = 3; // Limit retry attempts
const MAX_PORT = 65535;

let server = null; // Track server instance

const startServer = async (port, retryCount = 0) => {
  if (server) {
    console.log("Server is already running, skipping initialization");
    return;
  }

  if (port > MAX_PORT) {
    console.error("Port number exceeds maximum allowed value (65535)");
    process.exit(1);
  }

  if (retryCount >= MAX_RETRIES) {
    console.error(`Failed to start server after ${MAX_RETRIES} attempts`);
    console.error(
      `Please ensure port ${PORT} is available or specify a different port using PORT environment variable`
    );
    process.exit(1);
  }

  try {
    // Initialize AdminJS first
    const admin = await initializeAdmin();

    // Body parser middleware - AFTER AdminJS setup
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // API routes
    app.use("/api", routes);

    // Error handling middleware
    app.use(errorHandler);

    server = httpServer
      .listen(port)
      .on("listening", () => {
        console.log(`Server is running on port ${port}`);
        console.log(
          `AdminJS started on http://localhost:${port}${admin.options.rootPath}`
        );
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`Port ${port} is in use`);
          if (port === PORT) {
            // Only retry with incremented port if it was the original intended port
            console.log(`Retrying with port ${port + 1}...`);
            server = null; // Reset server reference
            startServer(port + 1, retryCount + 1);
          } else {
            console.error(
              "Please specify a different port using PORT environment variable"
            );
            process.exit(1);
          }
        } else {
          console.error("Error starting server:", err);
          process.exit(1);
        }
      });

    // Handle graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      if (server) {
        server.close(() => {
          console.log("Server closed");
          process.exit(0);
        });
      }
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received, shutting down gracefully");
      if (server) {
        server.close(() => {
          console.log("Server closed");
          process.exit(0);
        });
      }
    });
  } catch (error) {
    console.error("Error initializing AdminJS:", error);
    process.exit(1);
  }
};

// Start the server
startServer(PORT);

// Export for testing purposes
module.exports = { app, httpServer };
