import asyncWrapper from "../../utils/asyncWrapper.js";
import { createJob, getUserJobs, cancelJob } from "./jobs.service.js";

export const scheduleJob = asyncWrapper(async (req, res) => {
  const job = await createJob(req.user._id, req.body);
  res.status(201).json({ status: "success", data: { job } });
});

export const listJobs = asyncWrapper(async (req, res) => {
  const jobs = await getUserJobs(req.user._id);
  res.status(200).json({ status: "success", data: { jobs } });
});

export const deleteJob = asyncWrapper(async (req, res) => {
  const job = await cancelJob(req.user._id, req.params.id);
  res.status(200).json({ status: "success", data: { job } });
});
