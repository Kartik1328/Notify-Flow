import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import env from "../config/env.js";

const authenticate = asyncWrapper(async (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("No token provided. Please log in.", 401);
  }

  const token = authHeader.split(" ")[1];

  // 2. Verify token
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // 3. Check user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError("User no longer exists.", 401);
  }

  // 4. Attach user to request for use in controllers
  req.user = user;
  next();
});

export default authenticate;
