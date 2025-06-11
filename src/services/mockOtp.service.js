class MockOTPService {
  constructor() {
    this.otpStore = new Map(); // Store OTPs in memory
    this.OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone, type = "sms") {
    try {
      const otp = this.generateOTP();
      const expiryTime = Date.now() + this.OTP_EXPIRY;

      // Store OTP with expiry time
      this.otpStore.set(phone, {
        otp,
        expiryTime,
        type,
        attempts: 0,
      });

      // Log the OTP for development purposes
      console.log(`[MOCK ${type.toUpperCase()}] Phone: ${phone}, OTP: ${otp}`);

      return {
        success: true,
        message: `OTP sent successfully via ${type}`,
        phone,
        // Only in development: return OTP
        otp,
        // ...(process.env.NODE_ENV === "development" && { otp: otp }),
      };
    } catch (error) {
      console.error("Mock OTP Service Error:", error);
      throw new Error("Failed to send OTP");
    }
  }

  async verifyOTP(phone, otp) {
    try {
      const storedData = this.otpStore.get(phone);

      // Check if OTP exists
      if (!storedData) {
        throw new Error("No OTP found for this phone number");
      }

      // Check OTP expiry
      if (Date.now() > storedData.expiryTime) {
        this.otpStore.delete(phone);
        throw new Error("OTP has expired");
      }

      // Increment attempts
      storedData.attempts += 1;

      // Check max attempts (3 attempts)
      if (storedData.attempts > 3) {
        this.otpStore.delete(phone);
        throw new Error("Maximum verification attempts exceeded");
      }

      // Verify OTP
      if (storedData.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      // Clear OTP after successful verification
      this.otpStore.delete(phone);

      return {
        success: true,
        message: "OTP verified successfully",
        phone,
      };
    } catch (error) {
      throw error;
    }
  }

  // Clear expired OTPs periodically
  clearExpiredOTPs() {
    for (const [phone, data] of this.otpStore.entries()) {
      if (Date.now() > data.expiryTime) {
        this.otpStore.delete(phone);
      }
    }
  }
}

// Create singleton instance
const mockOTPService = new MockOTPService();

// Clear expired OTPs every 5 minutes
setInterval(() => {
  mockOTPService.clearExpiredOTPs();
}, 5 * 60 * 1000);

module.exports = mockOTPService;
