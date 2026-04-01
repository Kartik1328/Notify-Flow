import AuditLog from "../models/AuditLog.js";
import logger from "../utils/logger.js";

/**
 * CONCEPT: Audit Log Middleware
 *
 * How it works:
 * - We intercept res.json() to capture what the response actually was
 * - After response is sent, we write the log to MongoDB asynchronously
 * - It never blocks the response — logging happens after client gets their data
 */

const auditLogger = (action) => (req, res, next) => {
  const startTime = Date.now();

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json to intercept the response
  res.json = function (body) {
    const responseTimeMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Write log asynchronously AFTER response is sent
    // setImmediate ensures this runs after the current event loop tick
    setImmediate(async () => {
      try {
        await AuditLog.create({
          userId: req.user?._id || null,
          userEmail: req.user?.email || "anonymous",
          action,
          method: req.method,
          endpoint: req.originalUrl,
          statusCode,
          success: statusCode < 400,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "unknown",
          responseTimeMs,
          metadata: {
            // Store safe metadata — never log passwords
            body: sanitizeBody(req.body),
            params: req.params,
            query: req.query,
          },
        });
      } catch (err) {
        // Log error but never crash the app because of audit logging
        logger.error(`Audit log failed: ${err.message}`);
      }
    });

    // Call original res.json — sends response to client
    return originalJson(body);
  };

  next();
};

// Remove sensitive fields before logging
const sanitizeBody = (body) => {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.confirmPassword;
  delete sanitized.token;
  return sanitized;
};

export default auditLogger;
