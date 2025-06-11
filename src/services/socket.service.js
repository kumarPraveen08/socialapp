const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");
const Chat = require("../models/chat.model");

class SocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
      },
    });
    this.userSockets = new Map(); // userId -> socketId
    this.modalSockets = new Map(); // modalId -> socketId
    this.initialize();
  }

  initialize() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) throw new Error("Authentication error");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userType = decoded.type; // 'user' or 'modal'
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleChatEvents(socket);
      this.handleTypingEvents(socket);
      this.handleCallEvents(socket);
      this.handleLiveStreamEvents(socket);
    });
  }

  handleConnection(socket) {
    const { userId, userType } = socket;
    if (userType === "user") {
      this.userSockets.set(userId, socket.id);
      this.updateUserStatus(userId, true);
    } else {
      this.modalSockets.set(userId, socket.id);
      this.updateModalStatus(userId, true);
    }
  }

  handleDisconnection(socket) {
    socket.on("disconnect", () => {
      const { userId, userType } = socket;
      if (userType === "user") {
        this.userSockets.delete(userId);
        this.updateUserStatus(userId, false);
      } else {
        this.modalSockets.delete(userId);
        this.updateModalStatus(userId, false);
      }
    });
  }

  async updateUserStatus(userId, isOnline) {
    await User.findByIdAndUpdate(userId, { isOnline });
    this.io.emit("user:status", { userId, isOnline });
  }

  async updateModalStatus(modalId, isOnline) {
    await Modal.findByIdAndUpdate(modalId, { isOnline });
    this.io.emit("modal:status", { modalId, isOnline });
  }

  handleChatEvents(socket) {
    socket.on("chat:join", (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("chat:message", async (data) => {
      const { chatId, message, type = "text" } = data;
      const chat = await Chat.findById(chatId);

      if (!chat) return;

      const newMessage = {
        sender: socket.userId,
        senderType: socket.userType,
        content: message,
        type,
        timestamp: new Date(),
      };

      chat.messages.push(newMessage);
      await chat.save();

      this.io.to(`chat:${chatId}`).emit("chat:message", newMessage);
    });
  }

  handleTypingEvents(socket) {
    socket.on("typing:start", (chatId) => {
      socket.to(`chat:${chatId}`).emit("typing:start", {
        userId: socket.userId,
        userType: socket.userType,
      });
    });

    socket.on("typing:stop", (chatId) => {
      socket.to(`chat:${chatId}`).emit("typing:stop", {
        userId: socket.userId,
        userType: socket.userType,
      });
    });
  }

  handleCallEvents(socket) {
    socket.on("call:request", (data) => {
      const { receiverId, type } = data;
      const receiverSocket = this.getReceiverSocket(receiverId);
      if (receiverSocket) {
        this.io.to(receiverSocket).emit("call:incoming", {
          callerId: socket.userId,
          callerType: socket.userType,
          type,
        });
      }
    });

    socket.on("call:accept", (data) => {
      const { callerId } = data;
      const callerSocket = this.getReceiverSocket(callerId);
      if (callerSocket) {
        this.io.to(callerSocket).emit("call:accepted", {
          receiverId: socket.userId,
        });
      }
    });

    socket.on("call:reject", (data) => {
      const { callerId } = data;
      const callerSocket = this.getReceiverSocket(callerId);
      if (callerSocket) {
        this.io.to(callerSocket).emit("call:rejected", {
          receiverId: socket.userId,
        });
      }
    });

    socket.on("call:end", (data) => {
      const { receiverId } = data;
      const receiverSocket = this.getReceiverSocket(receiverId);
      if (receiverSocket) {
        this.io.to(receiverSocket).emit("call:ended", {
          callerId: socket.userId,
        });
      }
    });
  }

  handleLiveStreamEvents(socket) {
    socket.on("live:start", async (data) => {
      const { title, category } = data;
      const modalId = socket.userId;

      // Create live stream room
      const roomId = `live:${modalId}`;
      socket.join(roomId);

      // Broadcast live stream start
      this.io.emit("live:started", {
        modalId,
        title,
        category,
        viewers: 0,
      });
    });

    socket.on("live:join", (modalId) => {
      const roomId = `live:${modalId}`;
      socket.join(roomId);
      this.updateLiveViewers(modalId);
    });

    socket.on("live:leave", (modalId) => {
      const roomId = `live:${modalId}`;
      socket.leave(roomId);
      this.updateLiveViewers(modalId);
    });

    socket.on("live:gift", (data) => {
      const { modalId, gift } = data;
      const roomId = `live:${modalId}`;
      this.io.to(roomId).emit("live:gift", {
        userId: socket.userId,
        gift,
      });
    });

    socket.on("live:end", () => {
      const modalId = socket.userId;
      const roomId = `live:${modalId}`;
      this.io.to(roomId).emit("live:ended");
      this.io.in(roomId).socketsLeave(roomId);
    });
  }

  updateLiveViewers(modalId) {
    const roomId = `live:${modalId}`;
    const sockets = this.io.sockets.adapter.rooms.get(roomId);
    const viewerCount = sockets ? sockets.size : 0;
    this.io.to(roomId).emit("live:viewers", { count: viewerCount });
  }

  getReceiverSocket(receiverId) {
    return (
      this.userSockets.get(receiverId) || this.modalSockets.get(receiverId)
    );
  }

  // Utility method to emit to a specific user
  emitToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Utility method to emit to a specific modal
  emitToModal(modalId, event, data) {
    const socketId = this.modalSockets.get(modalId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Utility method to broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketService;
