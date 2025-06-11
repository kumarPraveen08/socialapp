const admin = require("firebase-admin");
const User = require("../models/user.model");
const Modal = require("../models/modal.model");
const { AppError } = require("../middleware/errorHandler");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

class NotificationService {
  constructor() {
    this.messaging = admin.messaging();
  }

  async sendToUser(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) return false;

      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            priority: "max",
            channelId: notification.channelId || "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  async sendToModal(modalId, notification) {
    try {
      const modal = await Modal.findById(modalId);
      if (!modal || !modal.fcmToken) return false;

      const message = {
        token: modal.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            priority: "max",
            channelId: notification.channelId || "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  async sendToMultipleUsers(userIds, notification) {
    try {
      const users = await User.find({ _id: { $in: userIds } });
      const tokens = users.map((user) => user.fcmToken).filter(Boolean);

      if (tokens.length === 0) return false;

      const message = {
        tokens: tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            priority: "max",
            channelId: notification.channelId || "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.sendMulticast(message);
      return response;
    } catch (error) {
      console.error("Error sending notifications:", error);
      return false;
    }
  }

  async sendToTopic(topic, notification) {
    try {
      const message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            priority: "max",
            channelId: notification.channelId || "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      return response;
    } catch (error) {
      console.error("Error sending topic notification:", error);
      return false;
    }
  }

  async subscribeToTopic(tokens, topic) {
    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error("Error subscribing to topic:", error);
      return false;
    }
  }

  async unsubscribeFromTopic(tokens, topic) {
    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
      return false;
    }
  }

  // Utility methods for common notifications

  async sendChatNotification(userId, sender, message) {
    return this.sendToUser(userId, {
      title: sender.name,
      body: message,
      data: {
        type: "chat",
        senderId: sender._id.toString(),
      },
      channelId: "chat",
    });
  }

  async sendCallNotification(userId, caller, callType) {
    return this.sendToUser(userId, {
      title: `Incoming ${callType} Call`,
      body: `${caller.name} is calling you`,
      data: {
        type: "call",
        callType,
        callerId: caller._id.toString(),
      },
      channelId: "call",
    });
  }

  async sendGiftNotification(modalId, sender, gift) {
    return this.sendToModal(modalId, {
      title: "New Gift Received!",
      body: `${sender.name} sent you a ${gift.name}`,
      data: {
        type: "gift",
        senderId: sender._id.toString(),
        giftId: gift._id.toString(),
      },
      channelId: "gift",
    });
  }

  async sendWalletNotification(userId, type, amount) {
    const title = type === "credit" ? "Wallet Credited" : "Wallet Debited";
    const body = `Your wallet has been ${type}ed with ${amount} coins`;

    return this.sendToUser(userId, {
      title,
      body,
      data: {
        type: "wallet",
        transactionType: type,
        amount: amount.toString(),
      },
      channelId: "wallet",
    });
  }

  async sendWithdrawalNotification(modalId, status, amount) {
    const title = `Withdrawal ${
      status.charAt(0).toUpperCase() + status.slice(1)
    }`;
    const body =
      status === "approved"
        ? `Your withdrawal request for ${amount} has been approved`
        : `Your withdrawal request for ${amount} has been rejected`;

    return this.sendToModal(modalId, {
      title,
      body,
      data: {
        type: "withdrawal",
        status,
        amount: amount.toString(),
      },
      channelId: "withdrawal",
    });
  }
}

module.exports = new NotificationService();
