const { RtcTokenBuilder, Role } = require("agora-token");
const { AppError } = require("../middleware/errorHandler");

class AgoraService {
  constructor() {
    this.appId = process.env.AGORA_APP_ID;
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!this.appId || !this.appCertificate) {
      throw new Error("Agora credentials not configured");
    }
  }

  generateToken(
    channelName,
    uid,
    role = Role.PUBLISHER,
    privilegeExpireTime = 3600
  ) {
    try {
      // Set token expire time in seconds
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expireTimestamp = currentTimestamp + privilegeExpireTime;

      // Build token
      const token = RtcTokenBuilder.build(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        role,
        expireTimestamp,
        expireTimestamp
      );

      return {
        token,
        appId: this.appId,
        channel: channelName,
        uid,
        expireAt: expireTimestamp,
      };
    } catch (error) {
      throw new AppError("Error generating Agora token", 500);
    }
  }

  generateCallToken(callId, userId) {
    return this.generateToken(
      `call_${callId}`,
      userId,
      Role.PUBLISHER,
      3600 // 1 hour
    );
  }

  generateLiveStreamToken(streamId, userId, isHost = false) {
    return this.generateToken(
      `live_${streamId}`,
      userId,
      isHost ? Role.PUBLISHER : Role.SUBSCRIBER,
      7200 // 2 hours
    );
  }

  // Utility method to validate channel name
  validateChannelName(channelName) {
    // Channel name must be less than 64 bytes
    const bytes = Buffer.from(channelName);
    if (bytes.length > 64) {
      throw new AppError("Channel name too long", 400);
    }

    // Channel name can only contain alphanumeric characters, underscore and hyphen
    if (!/^[a-zA-Z0-9_-]+$/.test(channelName)) {
      throw new AppError("Invalid channel name format", 400);
    }

    return true;
  }

  // Utility method to generate unique channel names
  generateChannelName(prefix, id) {
    const channelName = `${prefix}_${id}_${Date.now()}`;
    this.validateChannelName(channelName);
    return channelName;
  }

  // Method to handle call setup
  async setupCall(callId, userId1, userId2) {
    const channelName = this.generateChannelName("call", callId);

    // Generate tokens for both users
    const token1 = this.generateToken(channelName, userId1);
    const token2 = this.generateToken(channelName, userId2);

    return {
      channelName,
      user1Token: token1,
      user2Token: token2,
    };
  }

  // Method to handle live stream setup
  async setupLiveStream(streamId, hostId) {
    const channelName = this.generateChannelName("live", streamId);

    // Generate token for host
    const hostToken = this.generateToken(
      channelName,
      hostId,
      Role.PUBLISHER,
      7200 // 2 hours
    );

    return {
      channelName,
      hostToken,
    };
  }

  // Method to generate viewer token for live stream
  async generateViewerToken(channelName, viewerId) {
    return this.generateToken(
      channelName,
      viewerId,
      Role.SUBSCRIBER,
      7200 // 2 hours
    );
  }

  // Cloud Recording Methods (if enabled)
  async startRecording(channelName, uid, resourceId) {
    // Implement cloud recording start logic here
    // This requires Agora Cloud Recording service enabled
    throw new AppError("Cloud recording not implemented", 501);
  }

  async stopRecording(channelName, uid, resourceId, sid) {
    // Implement cloud recording stop logic here
    // This requires Agora Cloud Recording service enabled
    throw new AppError("Cloud recording not implemented", 501);
  }

  // RTM Token Generation (if needed for chat)
  generateRtmToken(userId) {
    // Implement RTM token generation if needed
    // This requires Agora RTM service enabled
    throw new AppError("RTM token generation not implemented", 501);
  }
}

module.exports = new AgoraService();
