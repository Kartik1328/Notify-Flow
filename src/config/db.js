import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () =>
  logger.warn("MongoDB disconnected"),
);
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

export default connectDB;
