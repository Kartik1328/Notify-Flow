import Job from "../../models/Job.js";
import jobQueue from "../../queues/jobQueue.js";
import AppError from "../../utils/AppError.js";

export const createJob = async (userId, { type, payload, scheduledAt }) => {
  const delay = new Date(scheduledAt).getTime() - Date.now();

  if (delay < 0) {
    throw new AppError("Scheduled time must be in the future", 400);
  }

  // Save to MongoDB first — source of truth
  const job = await Job.create({
    userId,
    type,
    payload,
    scheduledAt,
    status: "pending",
  });

  // Add to BullMQ with delay
  const bullJob = await jobQueue.add(
    type,
    { type, payload, jobId: job._id },
    { delay }, // BullMQ will wait this many ms before processing
  );

  // Save BullMQ job ID for tracking
  job.bullJobId = bullJob.id;
  await job.save();

  return job;
};

export const getUserJobs = async (userId) => {
  return Job.find({ userId }).sort({ createdAt: -1 });
};

export const cancelJob = async (userId, jobId) => {
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) throw new AppError("Job not found", 404);
  if (job.status !== "pending") {
    throw new AppError("Only pending jobs can be cancelled", 400);
  }

  // Remove from BullMQ
  const bullJob = await jobQueue.getJob(job.bullJobId);
  if (bullJob) await bullJob.remove();

  // Update MongoDB status
  job.status = "failed";
  await job.save();

  return job;
};
