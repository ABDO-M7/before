/**
 * ✅ Metadata Caching Utility
 * Caches metadata generation results to improve performance and reduce API calls
 */

// In-memory cache for metadata
const metadataCache = new Map();

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Default TTL: 1 hour (3600 seconds)
  defaultTTL: 3600,
  // Maximum cache size (prevent memory leaks)
  maxSize: 1000,
};

/**
 * Generate cache key from parameters
 * @param {string} type - Metadata type (e.g., 'product', 'blog', 'home')
 * @param {string|object} identifier - Unique identifier (slug, id, etc.)
 * @returns {string} Cache key
 */
function generateCacheKey(type, identifier) {
  if (typeof identifier === 'object') {
    identifier = JSON.stringify(identifier);
  }
  return `${type}:${identifier}`;
}

/**
 * Get cached metadata
 * @param {string} type - Metadata type
 * @param {string|object} identifier - Unique identifier
 * @returns {object|null} Cached metadata or null if not found/expired
 */
export function getCachedMetadata(type, identifier) {
  const key = generateCacheKey(type, identifier);
  const cached = metadataCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache is expired
  const now = Date.now();
  if (now > cached.expiresAt) {
    metadataCache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Set metadata in cache
 * @param {string} type - Metadata type
 * @param {string|object} identifier - Unique identifier
 * @param {object} metadata - Metadata to cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 */
export function setCachedMetadata(type, identifier, metadata, ttl = CACHE_CONFIG.defaultTTL) {
  // Prevent cache from growing too large
  if (metadataCache.size >= CACHE_CONFIG.maxSize) {
    // Remove oldest entries (simple FIFO)
    const firstKey = metadataCache.keys().next().value;
    if (firstKey) {
      metadataCache.delete(firstKey);
    }
  }

  const key = generateCacheKey(type, identifier);
  const expiresAt = Date.now() + (ttl * 1000);

  metadataCache.set(key, {
    data: metadata,
    expiresAt,
    cachedAt: Date.now(),
  });
}

/**
 * Clear cached metadata
 * @param {string} type - Metadata type (optional, clears all if not provided)
 * @param {string|object} identifier - Unique identifier (optional)
 */
export function clearCachedMetadata(type, identifier) {
  if (!type) {
    // Clear all cache
    metadataCache.clear();
    return;
  }

  if (identifier) {
    // Clear specific entry
    const key = generateCacheKey(type, identifier);
    metadataCache.delete(key);
  } else {
    // Clear all entries of this type
    const prefix = `${type}:`;
    for (const key of metadataCache.keys()) {
      if (key.startsWith(prefix)) {
        metadataCache.delete(key);
      }
    }
  }
}

/**
 * Get cache statistics (for debugging/monitoring)
 * @returns {object} Cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let expiredCount = 0;
  let validCount = 0;

  for (const cached of metadataCache.values()) {
    if (now > cached.expiresAt) {
      expiredCount++;
    } else {
      validCount++;
    }
  }

  return {
    total: metadataCache.size,
    valid: validCount,
    expired: expiredCount,
    maxSize: CACHE_CONFIG.maxSize,
  };
}

/**
 * Clean expired entries from cache
 * @returns {number} Number of entries removed
 */
export function cleanExpiredCache() {
  const now = Date.now();
  let removed = 0;

  for (const [key, cached] of metadataCache.entries()) {
    if (now > cached.expiresAt) {
      metadataCache.delete(key);
      removed++;
    }
  }

  return removed;
}

// Clean expired cache every 10 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    cleanExpiredCache();
  }, 10 * 60 * 1000); // 10 minutes
}
