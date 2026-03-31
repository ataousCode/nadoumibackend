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

// Shared configuration for all Redis needs (API, Queue, and Worker)
// We use a resilient approach: allow buffering (offline queue) but with a connection timeout.
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  connectTimeout: 15000,
  keepAlive: 30000,
  enableOfflineQueue: true, // Allow commands to buffer until ready
  retryStrategy(times) {
    return Math.min(times * 1000, 30000);
  },
  ...(isTLS && { tls: { rejectUnauthorized: false } }),
});

redisConnection.on("connect", () => {
  logger.info("Connected to Redis");
});

redisConnection.on("error", (err) => {
  logger.error("Redis connection error", { error: err.message });
});

export default redisConnection;
