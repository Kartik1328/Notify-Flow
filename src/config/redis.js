import Redis from "ioredis";
import env from "./env.js";
import logger from "../utils/logger.js";

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error(`Redis error: ${err.message}`));
redis.on("close", () => logger.warn("Redis connection closed"));

export const bullMQConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
};

export default redis;
