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

let redisConnection;

if (process.env.NODE_ENV !== "test") {
  redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    connectTimeout: 5000, // Reduced from 20s to fail fast
    keepAlive: 30000,
    retryStrategy(times) {
      const delay = Math.min(times * 500, 10000); // More aggressive backoff
      return delay;
    },
    enableOfflineQueue: false, // CRITICAL: Stop buffering commands if disconnected (prevents hang)
    ...(isTLS && { tls: { rejectUnauthorized: false } }),
  });

  redisConnection.on("connect", () => {
    logger.info("Connected to Redis");
  });

  redisConnection.on("error", (err) => {
    logger.error("Redis connection error", { error: err.message });
  });
} else {
  // Mock Redis for tests
  redisConnection = {
    on: () => {},
    off: () => {},
    quit: async () => {},
    call: async () => 0,
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    keys: async () => [],
    options: {},
  };
}

export default redisConnection;
