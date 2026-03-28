import Redis from "ioredis";
import logger from "../utils/logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Upstash (and any TLS-enabled Redis) requires `tls: {}` when using rediss://
const isTLS = REDIS_URL.startsWith("rediss://");

let redisConnection;

if (process.env.NODE_ENV !== "test") {
  redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    connectTimeout: 20000,
    keepAlive: 30000,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    enableOfflineQueue: true,
    ...(isTLS && { tls: { rejectUnauthorized: false } }), // Often needed for Upstash via some networks
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
