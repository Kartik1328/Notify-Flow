import { Router } from "express";
import { scheduleJob, listJobs, deleteJob } from "./jobs.controller.js";
import { createJobSchema } from "./jobs.validation.js";
import validate from "../../middlewares/validate.js";
import authenticate from "../../middlewares/authenticate.js";
import auditLogger from "../../middlewares/auditLogger.js";

const router = Router();

// All job routes require authentication
router.use(authenticate);

router.post(
  "/",
  auditLogger("JOB_CREATED"),
  validate(createJobSchema),
  scheduleJob,
);
router.get("/", auditLogger("JOB_LIST"), listJobs);
router.delete("/:id", auditLogger("JOB_CANCELLED"), deleteJob);

export default router;
