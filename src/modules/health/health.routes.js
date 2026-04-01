import { Router } from "express";
import mongoose from "mongoose";
import redis from "../../config/redis.js";
import emailQueue from "../../queues/emailQueue.js";
import jobQueue from "../../queues/jobQueue.js";
import logger from "../../utils/logger.js";

const router = Router();

/**
 * CONCEPT: API Health Monitor
 *
 * A production health endpoint checks every critical dependency:
 * - MongoDB: can we read from it?
 * - Redis: can we ping it?
 * - BullMQ queues: how many jobs are waiting/active/failed?
 * - System: memory usage, uptime
 *
 * Used by: Docker healthchecks, load balancers, uptime monitors (UptimeRobot etc.)
 * If status is 'degraded' or 'unhealthy' → ops team gets alerted
 */

router.get("/", async (_req, res) => {
  const start = Date.now();
  const checks = {};

  // ── 1. MongoDB Check ─────────────────────────────────────────────
  try {
    await mongoose.connection.db.admin().ping();
    checks.mongodb = {
      status: "healthy",
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    logger.error(`Health check - MongoDB failed: ${err.message}`);
    checks.mongodb = {
      status: "unhealthy",
      error: err.message,
    };
  }

  // ── 2. Redis Check ───────────────────────────────────────────────
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = {
      status: "healthy",
      responseTimeMs: Date.now() - redisStart,
    };
  } catch (err) {
    logger.error(`Health check - Redis failed: ${err.message}`);
    checks.redis = {
      status: "unhealthy",
      error: err.message,
    };
  }

  // ── 3. BullMQ Queue Stats ────────────────────────────────────────
  try {
    const [emailWaiting, emailActive, emailFailed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getFailedCount(),
    ]);

    const [jobWaiting, jobActive, jobDelayed, jobFailed] = await Promise.all([
      jobQueue.getWaitingCount(),
      jobQueue.getActiveCount(),
      jobQueue.getDelayedCount(),
      jobQueue.getFailedCount(),
    ]);

    checks.queues = {
      status: "healthy",
      email: {
        waiting: emailWaiting,
        active: emailActive,
        failed: emailFailed,
      },
      jobs: {
        waiting: jobWaiting,
        active: jobActive,
        delayed: jobDelayed,
        failed: jobFailed,
      },
    };
  } catch (err) {
    logger.error(`Health check - Queue stats failed: ${err.message}`);
    checks.queues = {
      status: "unhealthy",
      error: err.message,
    };
  }

  // ── 4. System Info ───────────────────────────────────────────────
  const memoryUsage = process.memoryUsage();
  checks.system = {
    status: "healthy",
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
  };

  // ── Overall Status ───────────────────────────────────────────────
  const isUnhealthy = Object.values(checks).some(
    (c) => c.status === "unhealthy",
  );
  const overallStatus = isUnhealthy ? "unhealthy" : "healthy";
  const httpStatus = isUnhealthy ? 503 : 200;

  res.status(httpStatus).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalResponseTimeMs: Date.now() - start,
    checks,
  });
});

export default router;
