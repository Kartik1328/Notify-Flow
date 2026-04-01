import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["SEND_REMINDER", "GENERATE_REPORT"],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    bullJobId: {
      type: String, // BullMQ job ID — for tracking
      default: null,
    },
  },
  { timestamps: true },
);

jobSchema.index({ userId: 1, status: 1 });
jobSchema.index({ scheduledAt: 1 });

const Job = mongoose.model("Job", jobSchema);
export default Job;
