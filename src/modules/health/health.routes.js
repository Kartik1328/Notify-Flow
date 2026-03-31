import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "NotifyFlow API is running",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

export default router;
