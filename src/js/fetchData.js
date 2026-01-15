// ============================================
// Simple In-Memory LRU Cache with TTL
// ============================================
class LRUCache {
  constructor(maxSize = 100, defaultTTL = 60000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // Default: 60 seconds
    this.cache = new Map();
  }

  // Generate a cache key from URL
  static generateKey(url) {
    return `api_${url}`;
  }

  get(key) {
    if (!key) return null;
    
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    if (!key) return;

    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Cache configuration
const CACHE_TTL = parseInt(process.env.ASTRO_CACHE_TTL || import.meta.env?.ASTRO_CACHE_TTL || '60000', 10); // Default 60 seconds
const CACHE_MAX_SIZE = parseInt(process.env.ASTRO_CACHE_MAX_SIZE || import.meta.env?.ASTRO_CACHE_MAX_SIZE || '100', 10);
const CACHE_ENABLED = (process.env.ASTRO_CACHE_ENABLED || import.meta.env?.ASTRO_CACHE_ENABLED) !== 'false'; // Enabled by default

// Global cache instance (persists across requests in the same serverless function instance)
const apiCache = new LRUCache(CACHE_MAX_SIZE, CACHE_TTL);

// ============================================
// Fetch Functions
// ============================================

export async function fetchData(url, options = {}) {
  const startTime = Date.now();
  
  if (!CACHE_ENABLED) {
    console.log(`[FETCH] ${url} - Cache disabled, fetching from API`);
    const response = await fetch(url, options);
    return await response.json();
  }

  // Generate cache key
  const cacheKey = LRUCache.generateKey(url);
  
  // Try to get from cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE HIT] ${url} - served from cache (${Date.now() - startTime}ms)`);
    return { data: cachedData, fromCache: true, loadTime: Date.now() - startTime };
  }

  // Cache miss - fetch from API
  console.log(`[CACHE MISS] ${url} - fetching from API...`);
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Store in cache
    apiCache.set(cacheKey, data, CACHE_TTL);
    
    console.log(`[FETCHED] ${url} - stored in cache (${Date.now() - startTime}ms, TTL: ${CACHE_TTL}ms, cache size: ${apiCache.size})`);
    return { data, fromCache: false, loadTime: Date.now() - startTime };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// ============================================
// Cache Control Helpers
// ============================================

/**
 * Manually clear the cache (useful for webhooks)
 */
export function clearCache() {
  apiCache.clear();
  console.log('[CACHE] Cache cleared');
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
  return {
    size: apiCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttl: CACHE_TTL,
    enabled: CACHE_ENABLED,
  };
}