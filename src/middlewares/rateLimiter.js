import redis from "../config/redis.js";
import AppError from "../utils/AppError.js";
import env from "../config/env.js";

const rateLimiter = async (req, res, next) => {
  try {
    // Use user ID if logged in, otherwise fall back to IP
    const identifier = req.user?.id || req.ip;
    const key = `rate_limit:${identifier}`;

    // Increment request count for this key
    const requests = await redis.incr(key);

    // On first request, set the expiry window
    if (requests === 1) {
      await redis.pexpire(key, env.RATE_LIMIT_WINDOW_MS);
    }

    // Get remaining TTL to send in headers
    const ttl = await redis.pttl(key);

    // Set rate limit info headers (same as industry standard)
    res.setHeader("X-RateLimit-Limit", env.RATE_LIMIT_MAX);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, env.RATE_LIMIT_MAX - requests),
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + ttl).toISOString(),
    );

    if (requests > env.RATE_LIMIT_MAX) {
      throw new AppError("Too many requests. Please try again later.", 429);
    }

    next();
  } catch (err) {
    next(err);
  }
};

export default rateLimiter;
