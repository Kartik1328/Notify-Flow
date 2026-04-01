import app from "./app.js";
import connectDB from "./config/db.js";
import redis from "./config/redis.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";

// Import workers — this starts them automatically
import './queues/workers/emailWorker.js';
import './queues/workers/jobWorker.js';

await connectDB();

const server = app.listen(env.PORT, () => {
  logger.info(`NotifyFlow running on port ${env.PORT} [${env.NODE_ENV}]`);
});

const shutdown = async (signal) => {
  logger.warn(`${signal} received — starting graceful shutdown`);
  server.close(async () => {
    logger.info("HTTP server closed");
    await redis.quit();
    logger.info("Redis closed");
    const mongoose = await import("mongoose");
    await mongoose.default.connection.close();
    logger.info("MongoDB closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  shutdown("unhandledRejection");
});
