import logger from "../utils/logger.js";
import AppError from "../utils/AppError.js";

const handleMongooseCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    logger.error("UNEXPECTED ERROR:", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error(
    `${err.statusCode} - ${err.message} - ${req.method} ${req.originalUrl}`,
  );

  if (process.env.NODE_ENV === "development") {
    sendDevError(err, res);
  } else {
    let normalizedErr = { ...err, message: err.message };
    if (err.name === "CastError") normalizedErr = handleMongooseCastError(err);
    if (err.code === 11000) normalizedErr = handleDuplicateKey(err);
    if (err.name === "ValidationError")
      normalizedErr = handleValidationError(err);
    if (err.name === "JsonWebTokenError") normalizedErr = handleJWTError();
    if (err.name === "TokenExpiredError")
      normalizedErr = handleJWTExpiredError();
    sendProdError(normalizedErr, res);
  }
};

export default errorHandler;
