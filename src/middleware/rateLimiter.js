const Redis = require("ioredis");
const { AppError } = require("./errorHandler");

const redis = new Redis(process.env.REDIS_URL);

// Rate limit configurations
const RATE_LIMITS = {
  // Auth endpoints
  auth: {
    points: 5,
    duration: 60 * 15, // 15 minutes
    blockDuration: 60 * 60, // 1 hour
  },
  // API endpoints
  api: {
    points: 100,
    duration: 60, // 1 minute
    blockDuration: 60 * 15, // 15 minutes
  },
  // Chat/Call endpoints
  realtime: {
    points: 300,
    duration: 60, // 1 minute
    blockDuration: 60 * 5, // 5 minutes
  },
  // Upload endpoints
  upload: {
    points: 10,
    duration: 60, // 1 minute
    blockDuration: 60 * 30, // 30 minutes
  },
};

class RateLimiter {
  constructor(type = "api") {
    this.config = RATE_LIMITS[type];
    if (!this.config) {
      throw new Error(`Invalid rate limit type: ${type}`);
    }
  }

  getKey(identifier, type) {
    return `ratelimit:${type}:${identifier}`;
  }

  async isBlocked(identifier) {
    const blockedKey = this.getKey(identifier, "blocked");
    return await redis.exists(blockedKey);
  }

  async block(identifier) {
    const blockedKey = this.getKey(identifier, "blocked");
    await redis.setex(blockedKey, this.config.blockDuration, "1");
  }

  async getAttempts(identifier) {
    const attemptsKey = this.getKey(identifier, "attempts");
    const attempts = await redis.get(attemptsKey);
    return parseInt(attempts) || 0;
  }

  async incrementAttempts(identifier) {
    const attemptsKey = this.getKey(identifier, "attempts");
    const attempts = await redis.incr(attemptsKey);

    // Set expiry on first attempt
    if (attempts === 1) {
      await redis.expire(attemptsKey, this.config.duration);
    }

    return attempts;
  }

  middleware() {
    return async (req, res, next) => {
      try {
        // Get identifier (IP or user ID if authenticated)
        const identifier = req.user ? req.user._id : req.ip;

        // Check if blocked
        if (await this.isBlocked(identifier)) {
          throw new AppError("Too many requests. Please try again later.", 429);
        }

        // Get and increment attempts
        const attempts = await this.incrementAttempts(identifier);

        // Set rate limit headers
        res.set({
          "X-RateLimit-Limit": this.config.points,
          "X-RateLimit-Remaining": Math.max(0, this.config.points - attempts),
          "X-RateLimit-Reset":
            Math.floor(Date.now() / 1000) + this.config.duration,
        });

        // Check if exceeded
        if (attempts > this.config.points) {
          await this.block(identifier);
          throw new AppError("Too many requests. Please try again later.", 429);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

// Export middleware factory functions
module.exports = {
  authLimiter: () => new RateLimiter("auth").middleware(),
  apiLimiter: () => new RateLimiter("api").middleware(),
  realtimeLimiter: () => new RateLimiter("realtime").middleware(),
  uploadLimiter: () => new RateLimiter("upload").middleware(),
};
