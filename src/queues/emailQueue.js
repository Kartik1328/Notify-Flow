import { Queue } from "bullmq";
import { bullMQConnection } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * CONCEPT: Job Queue
 * Instead of sending emails directly in the request/response cycle,
 * we ADD the email to a queue and return immediately.
 * A separate worker process picks it up and sends it.
 *
 * Benefits:
 * - Request is fast — no waiting for email to send
 * - If email fails, BullMQ retries automatically
 * - Emails are persisted in Redis — survive server restarts
 */

const emailQueue = new Queue("email", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 5, // retry up to 5 times
    backoff: {
      type: "exponential", // wait 2s, 4s, 8s, 16s, 32s between retries
      delay: 2000,
    },
    removeOnComplete: 100, // keep last 100 completed jobs in Redis
    removeOnFail: 200, // keep last 200 failed jobs for inspection
  },
});

emailQueue.on("error", (err) => {
  logger.error(`Email queue error: ${err.message}`);
});

export default emailQueue;
