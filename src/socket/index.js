const socketHandler = (io) => {
  // Store online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Handle user connection
    socket.on("user:connect", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("user:status", { userId, status: "online" });
    });

    // Handle private messages
    socket.on("chat:message", async (data) => {
      const { to, message } = data;
      const recipientSocket = onlineUsers.get(to);

      if (recipientSocket) {
        io.to(recipientSocket).emit("chat:message", {
          ...data,
          timestamp: new Date(),
        });
      }
    });

    // Handle typing status
    socket.on("chat:typing", (data) => {
      const { to } = data;
      const recipientSocket = onlineUsers.get(to);

      if (recipientSocket) {
        io.to(recipientSocket).emit("chat:typing", data);
      }
    });

    // Handle video/voice call signaling
    socket.on("call:request", (data) => {
      const { to } = data;
      const recipientSocket = onlineUsers.get(to);

      if (recipientSocket) {
        io.to(recipientSocket).emit("call:incoming", data);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      let disconnectedUserId;
      onlineUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
        }
      });

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        io.emit("user:status", {
          userId: disconnectedUserId,
          status: "offline",
        });
      }

      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = socketHandler;
