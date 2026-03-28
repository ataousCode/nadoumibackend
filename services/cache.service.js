import redis from "../config/redis.js";
import logger from "../utils/logger.js";

class CacheService {
  constructor(defaultTTL = 3600) {
    // Default TTL of 1 hour
    this.redis = redis;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get data from cache or fetch and cache it
   * @param {string} key Cache key
   * @param {Function} fetcher Async function to fetch data if not in cache
   * @param {number} ttl Time to live in seconds
   */
  async getOrSet(key, fetcher, ttl = this.defaultTTL) {
    try {
      const cachedData = await this.redis.get(key);

      if (cachedData) {
        logger.debug("Cache hit", { key });
        return JSON.parse(cachedData);
      }

      logger.debug("Cache miss", { key });
      const data = await fetcher();

      if (data !== undefined && data !== null) {
        await this.redis.set(key, JSON.stringify(data), "EX", ttl);
      }

      return data;
    } catch (error) {
      logger.error("Cache service error", { key, error: error.message });
      // Fallback to fetcher on cache error
      return fetcher();
    }
  }

  /**
   * Invalidate a specific cache key
   */
  async invalidate(key) {
    try {
      await this.redis.del(key);
      logger.debug("Cache invalidated", { key });
    } catch (error) {
      logger.error("Cache invalidation error", { key, error: error.message });
    }
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidateByPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
        logger.debug("Cache invalidated by pattern", {
          pattern,
          count: keys.length,
        });
      }
    } catch (error) {
      logger.error("Cache pattern invalidation error", {
        pattern,
        error: error.message,
      });
    }
  }
}

export default new CacheService();
