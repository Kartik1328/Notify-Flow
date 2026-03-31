import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import AppError from "../../utils/AppError.js";
import env from "../../config/env.js";

const signToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const registerUser = async ({ name, email, password }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const loginUser = async ({ email, password }) => {
  // Must explicitly select password since select: false in schema
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};
