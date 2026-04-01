import { Worker } from "bullmq";
import { bullMQConnection } from "../../config/redis.js";
import transporter from "../../config/mailer.js";
import logger from "../../utils/logger.js";

/**
 * CONCEPT: Background Worker + Retry with Exponential Backoff
 *
 * The worker runs separately from your Express app.
 * It listens to the email queue and processes jobs one by one.
 *
 * Exponential backoff means:
 * - Attempt 1 fails → wait 2s → retry
 * - Attempt 2 fails → wait 4s → retry
 * - Attempt 3 fails → wait 8s → retry
 * - Attempt 4 fails → wait 16s → retry
 * - Attempt 5 fails → job marked as FAILED, kept in Redis for inspection
 */

const emailWorker = new Worker(
  "email", // must match queue name
  async (job) => {
    const { to, subject, html, text } = job.data;

    logger.info(
      `Processing email job ${job.id} → ${to} (attempt ${job.attemptsMade + 1})`,
    );

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    logger.info(`Email job ${job.id} sent successfully to ${to}`);
    return { sentAt: new Date().toISOString(), to };
  },
  {
    connection: bullMQConnection,
    concurrency: 5, // process up to 5 emails simultaneously
  },
);

// Worker event listeners — great for monitoring
emailWorker.on("completed", (job, result) => {
  logger.info(`Email job ${job.id} completed: ${JSON.stringify(result)}`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(
    `Email job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
  );
});

emailWorker.on("error", (err) => {
  logger.error(`Email worker error: ${err.message}`);
});

export default emailWorker;
