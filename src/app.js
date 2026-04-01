import express from "express";
import cors from "cors";
import helmet from "helmet";

import errorHandler from "./middlewares/errorHandler.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import AppError from "./utils/AppError.js";
import logger from "./utils/logger.js";
import healthRouter from "./modules/health/health.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import auditRouter from "./modules/audit/audit.routes.js";
import jobsRouter from "./modules/jobs/jobs.routes.js";




const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to all API routes
app.use('/api', rateLimiter);

if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    logger.debug(`→ ${req.method} ${req.originalUrl}`);
    next();
  });
}

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/audit", auditRouter);
app.use("/api/v1/jobs", jobsRouter);




app.all("/{*path}", (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

export default app;
