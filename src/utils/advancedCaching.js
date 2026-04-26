/**
 * ✅ Advanced Multi-Layer Caching Utility
 * Implements multiple caching strategies for optimal performance
 */

/**
 * Memory cache for API responses
 */
class MemoryCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = ttl;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Browser cache wrapper (uses Cache API when available)
 */
class BrowserCache {
  constructor(cacheName = 'app-cache') {
    this.cacheName = cacheName;
    this.cache = null;
  }

  async init() {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return false;
    }

    try {
      this.cache = await caches.open(this.cacheName);
      return true;
    } catch (e) {
      return false;
    }
  }

  async set(key, value, ttl = 5 * 60 * 1000) {
    if (!this.cache) return false;

    try {
      const response = new Response(JSON.stringify({
        value,
        expiry: Date.now() + ttl,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${Math.floor(ttl / 1000)}`,
        },
      });

      await this.cache.put(key, response);
      return true;
    } catch (e) {
      return false;
    }
  }

  async get(key) {
    if (!this.cache) return null;

    try {
      const response = await this.cache.match(key);
      if (!response) return null;

      const data = await response.json();
      
      // Check if expired
      if (Date.now() > data.expiry) {
        await this.cache.delete(key);
        return null;
      }

      return data.value;
    } catch (e) {
      return null;
    }
  }

  async has(key) {
    if (!this.cache) return false;
    return (await this.cache.match(key)) !== undefined;
  }

  async clear() {
    if (!this.cache) return;
    await caches.delete(this.cacheName);
    await this.init();
  }
}

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Advanced caching manager with multiple layers
 */
export class AdvancedCache {
  constructor() {
    this.memoryCache = new MemoryCache(100, 5 * 60 * 1000); // 100 items, 5 min TTL
    this.browserCache = new BrowserCache('advanced-cache');
    this.browserCacheInitialized = false;
  }

  async init() {
    if (!this.browserCacheInitialized) {
      this.browserCacheInitialized = await this.browserCache.init();
    }
  }

  /**
   * Get value from cache (checks memory first, then browser)
   */
  async get(key) {
    if (IS_DEV) return null;

    // Check memory cache first (fastest)
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue !== null) {
      return memoryValue;
    }

    // Check browser cache
    await this.init();
    const browserValue = await this.browserCache.get(key);
    
    if (browserValue !== null) {
      // Populate memory cache for faster access
      this.memoryCache.set(key, browserValue);
      return browserValue;
    }

    return null;
  }

  /**
   * Set value in cache (stores in both memory and browser)
   */
  async set(key, value, ttl = 5 * 60 * 1000) {
    if (IS_DEV) return;

    // Set in memory cache (fast)
    this.memoryCache.set(key, value, ttl);

    // Set in browser cache (persistent)
    await this.init();
    await this.browserCache.set(key, value, ttl);
  }

  /**
   * Check if key exists in cache
   */
  async has(key) {
    if (this.memoryCache.has(key)) return true;
    
    await this.init();
    return await this.browserCache.has(key);
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memoryCache.clear();
    await this.init();
    await this.browserCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memoryCacheSize: this.memoryCache.size(),
      browserCacheInitialized: this.browserCacheInitialized,
    };
  }
}

// Export singleton instance
export const advancedCache = new AdvancedCache();

// Initialize on load
if (typeof window !== 'undefined') {
  advancedCache.init();
}
