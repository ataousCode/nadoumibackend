import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import redisConnection from '../config/redis.js'
import logger from '../utils/logger.js'

/**
 * Build a rate-limit store backed by the shared Redis connection.
 * Falls back gracefully to in-memory if Redis is not ready.
 */
function buildStore(prefix) {
  if (process.env.NODE_ENV === 'test') return undefined;
  
  // If Redis is not yet connected, fall back to MemoryStore instead of crashing
  if (!redisConnection || redisConnection.status !== 'ready') {
    logger.warn(`Rate limiter (${prefix}): Redis not ready, using MemoryStore fallback`);
    return undefined;
  }

  try {
    return new RedisStore({
      prefix,
      sendCommand: (...args) => redisConnection.call(...args),
    });
  } catch (err) {
    logger.warn(`Rate limiter (${prefix}): initialization failed, using MemoryStore fallback`, { error: err.message });
    return undefined; // express-rate-limit defaults to MemoryStore
  }
}

/**
 * Handler called when a client exceeds the rate limit.
 * Returns the same error shape used everywhere else in the app.
 */
const rateLimitExceededHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests. Please wait a moment and try again.',
      code: 'TOO_MANY_REQUESTS',
    },
  })
}

/**
 * strictLimiter — 5 requests per 15 minutes.
 * Applied to brute-force sensitive endpoints: login, forgot-password.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('rl:strict:'),
  handler: rateLimitExceededHandler,
  skipSuccessfulRequests: false,
})

/**
 * standardLimiter — 10 requests per 15 minutes.
 * Applied to: register, verify-email, resend-otp, reset-password.
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('rl:standard:'),
  handler: rateLimitExceededHandler,
  skipSuccessfulRequests: false,
})
