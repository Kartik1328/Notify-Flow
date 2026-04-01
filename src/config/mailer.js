import nodemailer from "nodemailer";
import env from "./env.js";
import logger from "../utils/logger.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify connection at startup
transporter.verify((error) => {
  if (error) {
    logger.warn(`Mailer not ready: ${error.message}`);
  } else {
    logger.info("Mailer ready");
  }
});

export default transporter;
