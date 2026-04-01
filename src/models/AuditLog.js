import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // Who did it
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for unauthenticated requests (login, register)
    },
    userEmail: {
      type: String,
      default: "anonymous",
    },

    // What they did
    action: {
      type: String,
      required: true,
      // e.g. 'USER_REGISTER', 'USER_LOGIN', 'JOB_CREATED', 'JOB_DELETED'
    },

    // Which endpoint
    method: {
      type: String,
      required: true, // GET, POST, PUT, DELETE
    },
    endpoint: {
      type: String,
      required: true, // /api/v1/auth/login
    },

    // What was the result
    statusCode: {
      type: Number,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },

    // Extra context (what changed, what was the payload etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Where request came from
    ipAddress: {
      type: String,
      default: "unknown",
    },
    userAgent: {
      type: String,
      default: "unknown",
    },

    // How long it took
    responseTimeMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt = when the action happened
  },
);

// Index for fast queries — most common: "show me all logs for user X"
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
