// ================================================
// 💾 Cache Service - Smart In-Memory Caching
// ================================================

/**
 * CacheService - Smart caching layer for API responses
 *
 * Features:
 * - TTL (Time To Live) support
 * - Automatic expiration
 * - Cache invalidation
 * - Cache statistics
 * - Memory limit
 * - Tag-based invalidation
 *
 * Usage:
 * ```javascript
 * // Set cache
 * cache.set('tasks', tasksData, 5 * 60 * 1000); // 5 minutes
 *
 * // Get cache
 * const tasks = cache.get('tasks');
 * if (tasks) {
 *   // Use cached data
 * } else {
 *   // Fetch fresh data
 * }
 *
 * // Invalidate cache
 * cache.delete('tasks');
 * ```
 */
class CacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.timestamps = new Map();
    this.tags = new Map(); // key -> [tag1, tag2, ...]
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.maxSize = options.maxSize || 100; // Max cache entries
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    this.debug = options.debug || false;

    if (this.debug) {
      console.log('💾 CacheService initialized', {
        defaultTTL: this.defaultTTL,
        maxSize: this.maxSize
      });
    }

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @param {Array<string>} tags - Tags for this cache entry (optional)
   */
  set(key, value, ttl = this.defaultTTL, tags = []) {
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + ttl);

    if (tags.length > 0) {
      this.tags.set(key, tags);
    }

    this.stats.sets++;

    if (this.debug) {
      console.log(`💾 Cache SET: ${key}`, {
        ttl: `${ttl / 1000}s`,
        tags,
        size: this.cache.size
      });
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      if (this.debug) {
        console.log(`💾 Cache MISS: ${key}`);
      }
      return null;
    }

    const expiry = this.timestamps.get(key);
    if (Date.now() > expiry) {
      // Expired
      this.delete(key);
      this.stats.misses++;
      if (this.debug) {
        console.log(`💾 Cache EXPIRED: ${key}`);
      }
      return null;
    }

    this.stats.hits++;
    if (this.debug) {
      const timeLeft = Math.round((expiry - Date.now()) / 1000);
      console.log(`💾 Cache HIT: ${key} (${timeLeft}s left)`);
    }

    return this.cache.get(key);
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const expiry = this.timestamps.get(key);
    if (Date.now() > expiry) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.timestamps.delete(key);
    this.tags.delete(key);

    if (deleted) {
      this.stats.deletes++;
      if (this.debug) {
        console.log(`💾 Cache DELETE: ${key}`);
      }
    }

    return deleted;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.timestamps.clear();
    this.tags.clear();

    if (this.debug) {
      console.log(`💾 Cache CLEARED: ${size} entries removed`);
    }
  }

  /**
   * Invalidate cache by tag
   * @param {string} tag - Tag to invalidate
   * @returns {number} Number of entries deleted
   */
  invalidateByTag(tag) {
    let count = 0;

    for (const [key, tags] of this.tags.entries()) {
      if (tags.includes(tag)) {
        this.delete(key);
        count++;
      }
    }

    if (this.debug) {
      console.log(`💾 Cache invalidated by tag "${tag}": ${count} entries`);
    }

    return count;
  }

  /**
   * Cleanup expired entries
   * @returns {number} Number of entries removed
   */
  cleanup() {
    let count = 0;
    const now = Date.now();

    for (const [key, expiry] of this.timestamps.entries()) {
      if (now > expiry) {
        this.delete(key);
        count++;
      }
    }

    if (count > 0 && this.debug) {
      console.log(`💾 Cache cleanup: ${count} expired entries removed`);
    }

    return count;
  }

  /**
   * Evict oldest entry
   */
  evictOldest() {
    // Find oldest entry by expiry time
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, expiry] of this.timestamps.entries()) {
      if (expiry < oldestTime) {
        oldestTime = expiry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;

      if (this.debug) {
        console.log(`💾 Cache evicted oldest: ${oldestKey}`);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Stats object
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      evictions: this.stats.evictions,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Get all cache keys
   * @returns {Array<string>}
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get time left for a key (in seconds)
   * @param {string} key - Cache key
   * @returns {number} Seconds left, or -1 if not found
   */
  getTimeLeft(key) {
    if (!this.timestamps.has(key)) {
      return -1;
    }

    const expiry = this.timestamps.get(key);
    const timeLeft = expiry - Date.now();

    return timeLeft > 0 ? Math.round(timeLeft / 1000) : 0;
  }

  /**
   * Extend TTL for a key
   * @param {string} key - Cache key
   * @param {number} additionalTime - Additional time in milliseconds
   * @returns {boolean} True if extended
   */
  extendTTL(key, additionalTime) {
    if (!this.timestamps.has(key)) {
      return false;
    }

    const currentExpiry = this.timestamps.get(key);
    this.timestamps.set(key, currentExpiry + additionalTime);

    if (this.debug) {
      console.log(`💾 Cache TTL extended: ${key} (+${additionalTime / 1000}s)`);
    }

    return true;
  }

  /**
   * Destroy cache service (cleanup)
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();

    if (this.debug) {
      console.log('💾 CacheService destroyed');
    }
  }

  /**
   * Debug: Print cache info
   */
  debug() {
    console.group('💾 CacheService Debug Info');
    console.log('Stats:', this.getStats());
    console.log('Keys:', this.keys());
    console.log('Cache Contents:', Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      timeLeft: `${this.getTimeLeft(key)}s`,
      tags: this.tags.get(key) || [],
      valueType: typeof value,
      isArray: Array.isArray(value),
      size: Array.isArray(value) ? value.length : undefined
    })));
    console.groupEnd();
  }
}

// ================================================
// 🌍 Global Cache Instance
// ================================================

/**
 * Global cache instance
 */
window.cache = new CacheService({
  defaultTTL: 5 * 60 * 1000,  // 5 minutes
  maxSize: 50,                 // 50 entries max
  debug: false                 // Set to true for debugging
});

// ================================================
// 🎯 Cache Strategies
// ================================================

/**
 * Cache strategies for different data types
 */
window.cacheStrategies = {
  // Tasks: 5 minutes, can be invalidated
  tasks: {
    key: 'tasks',
    ttl: 5 * 60 * 1000,
    tags: ['tasks']
  },

  // Single task: 2 minutes
  task: (id) => ({
    key: `task:${id}`,
    ttl: 2 * 60 * 1000,
    tags: ['tasks', `task:${id}`]
  }),

  // Stats: 1 minute
  stats: {
    key: 'stats',
    ttl: 1 * 60 * 1000,
    tags: ['stats']
  },

  // User stats: 2 minutes
  userStats: (userName) => ({
    key: `stats:${userName}`,
    ttl: 2 * 60 * 1000,
    tags: ['stats', `user:${userName}`]
  })
};

// ================================================
// 🛠️ Helper Functions
// ================================================

/**
 * Invalidate all task-related caches
 */
window.invalidateTaskCache = function() {
  cache.invalidateByTag('tasks');
  console.log('♻️ Task cache invalidated');
};

/**
 * Invalidate all stats-related caches
 */
window.invalidateStatsCache = function() {
  cache.invalidateByTag('stats');
  console.log('♻️ Stats cache invalidated');
};

console.log('💾 Cache Service loaded successfully');
console.log('💡 Access cache via: window.cache');
console.log('💡 Cache stats: cache.getStats()');
console.log('💡 Debug cache: cache.debug()');
