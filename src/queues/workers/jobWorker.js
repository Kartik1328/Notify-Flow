import { Worker } from "bullmq";
import { bullMQConnection } from "../../config/redis.js";
import emailQueue from "../emailQueue.js";
import logger from "../../utils/logger.js";

/**
 * CONCEPT: Delayed Job Processing
 * This worker handles scheduled jobs — things that run in the future.
 * When a job's delay expires, BullMQ moves it from "delayed" to "waiting"
 * and this worker picks it up.
 *
 * Job types we support:
 * - SEND_REMINDER  → queues an email
 * - GENERATE_REPORT → placeholder for report logic
 */

const jobWorker = new Worker(
  "jobs",
  async (job) => {
    const { type, payload } = job.data;

    logger.info(`Processing job ${job.id} type=${type}`);

    switch (type) {
      case "SEND_REMINDER":
        // Add to email queue — which handles actual sending + retry
        await emailQueue.add("reminder-email", {
          to: payload.email,
          subject: payload.subject || "Reminder from NotifyFlow",
          html: `<p>${payload.message}</p>`,
          text: payload.message,
        });
        logger.info(`Reminder queued for ${payload.email}`);
        break;

      case "GENERATE_REPORT":
        // Placeholder — add report logic here
        logger.info(`Generating report for user ${payload.userId}`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate work
        break;

      default:
        logger.warn(`Unknown job type: ${type}`);
    }

    return { processedAt: new Date().toISOString(), type };
  },
  {
    connection: bullMQConnection,
    concurrency: 3,
  },
);

jobWorker.on("completed", (job, result) => {
  logger.info(`Job ${job.id} completed: ${JSON.stringify(result)}`);
});

jobWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});

jobWorker.on("error", (err) => {
  logger.error(`Job worker error: ${err.message}`);
});

export default jobWorker;
