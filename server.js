const PORT = parseInt(process.env.PORT || "5000");
const HOST = "0.0.0.0";

const startServer = async (port, retryCount = 0) => {
  // ... your existing setup code ...

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

    // Update the listen call to use HOST
    server = httpServer
      .listen(port, HOST)
      .on("listening", () => {
        console.log(`Server is running on ${HOST}:${port}`);
        console.log(
          `AdminJS started on http://${HOST}:${port}${admin.options.rootPath}`
        );
      })
      // ... rest of your server code ...
} 