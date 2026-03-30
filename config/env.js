import Joi from "joi";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3001),
  PROD_DATABASE_URL: Joi.string()
    .required()
    .description("PostgreSQL connection string"),
  USE_REDIS_SOCKET_ADAPTER: Joi.string()
    .valid("true", "false")
    .default("false")
    .description("Whether to use the Redis adapter for Socket.io"),
  REDIS_URL: Joi.string()
    .required()
    .description("Redis connection string (REQUIRED)"),
  JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .description("JWT secret key (min 32 chars)"),
  FRONTEND_URL: Joi.string()
    .required()
    .uri()
    .description("Frontend application URL"),

  // SMTP Configuration
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),

  // Cloudinary Storage
  CLOUDINARY_CLOUD_NAME: Joi.string()
    .required()
    .description("Cloudinary Cloud Name"),
  CLOUDINARY_API_KEY: Joi.string()
    .required()
    .description("Cloudinary API Key"),
  CLOUDINARY_API_SECRET: Joi.string()
    .required()
    .description("Cloudinary API Secret"),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const isTest = process.env.NODE_ENV === "test";

  if (!isTest) {
    logger.error("Environment validation failed:", {
      details: error.details.map((d) => d.message),
    });
    console.error("\n❌ CRITICAL ERROR: Incomplete environment configuration:");
    error.details.forEach((d) => console.error(`   - ${d.message}`));
    console.error(
      "\nPlease check your .env file and ensure all required variables are set.\n",
    );
    process.exit(1);
  } else {
    // In test mode, we want to know but not crash
    logger.warn(
      "Environment validation failed (Testing mode - non-blocking):",
      {
        details: error.details.map((d) => d.message),
      },
    );
  }
}

// Map PROD_DATABASE_URL to DATABASE_URL for parts of the app that expect it
const finalEnv = {
  ...envVars,
  DATABASE_URL: envVars.PROD_DATABASE_URL,
};

export default finalEnv;
