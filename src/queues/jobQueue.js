import { Queue } from "bullmq";
import { bullMQConnection } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * CONCEPT: Delayed Job Scheduler
 * BullMQ supports scheduling jobs to run at a future time.
 * Example: "send reminder email in 2 hours"
 * We add the job with a `delay` option — BullMQ handles the rest.
 */

const jobQueue = new Queue("jobs", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

jobQueue.on("error", (err) => {
  logger.error(`Job queue error: ${err.message}`);
});

export default jobQueue;
