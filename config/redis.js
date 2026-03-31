import Redis from "ioredis";
import logger from "../utils/logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
  logger.warn(
    "⚠️ REDIS_URL is not set in Production! Falling back to localhost. Check your Railway/Vault variables.",
  );
}

// Upstash (and any TLS-enabled Redis) requires `tls: {}` when using rediss://
const isTLS = REDIS_URL.startsWith("rediss://");

const commonOptions = {
  maxRetriesPerRequest: null,
  keepAlive: 30000,
  ...(isTLS && { tls: { rejectUnauthorized: false } }),
};

// Resilient configuration for BullMQ worker (allows retries and offline queue)
export const resilientConfig = {
  ...commonOptions,
  connectTimeout: 20000,
  enableOfflineQueue: true,
};

// Strict, fail-fast connection for API requests (prevents hangs)
const redisConnection = new Redis(REDIS_URL, {
  ...commonOptions,
  connectTimeout: 5000,
  enableOfflineQueue: false,
  retryStrategy(times) {
    return Math.min(times * 500, 10000);
  },
});

redisConnection.on("connect", () => {
  logger.info("Connected to Redis (Direct Client)");
});

redisConnection.on("error", (err) => {
  logger.error("Redis connection error (Direct Client)", { error: err.message });
});

export default redisConnection;
