import Redis from 'ioredis'
import logger from '../utils/logger.js'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Upstash (and any TLS-enabled Redis) requires `tls: {}` when using rediss://
const isTLS = REDIS_URL.startsWith('rediss://')

const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  retryStrategy(times) {
    return Math.min(times * 50, 2000)
  },
  enableOfflineQueue: true,
  ...(isTLS && { tls: {} }),
})

redisConnection.on('connect', () => {
  logger.info('Connected to Redis')
})

redisConnection.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message })
})

export default redisConnection
