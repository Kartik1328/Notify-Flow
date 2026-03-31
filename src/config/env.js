import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  MONGO_URI: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(2525),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),
})
  .unknown()
  .required();

const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation failed:\n${error.message}`);
}

export default env;
