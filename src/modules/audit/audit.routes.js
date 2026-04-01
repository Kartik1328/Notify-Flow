import { Router } from "express";
import AuditLog from "../../models/AuditLog.js";
import authenticate from "../../middlewares/authenticate.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

const router = Router();

// GET /api/v1/audit — get all audit logs (protected)
router.get(
  "/",
  authenticate,
  asyncWrapper(async (req, res) => {
    const { page = 1, limit = 20, action, userId } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("userId", "name email"); // join user details

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      status: "success",
      data: {
        logs,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  }),
);

export default router;
