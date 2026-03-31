import asyncWrapper from "../../utils/asyncWrapper.js";
import { registerUser, loginUser } from "./auth.service.js";

export const register = asyncWrapper(async (req, res, next) => {
  const result = await registerUser(req.body);
  res.status(201).json({
    status: "success",
    data: result,
  });
});

export const login = asyncWrapper(async (req, res, next) => {
  const result = await loginUser(req.body);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
