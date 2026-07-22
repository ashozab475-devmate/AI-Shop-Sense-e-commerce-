// Simple in-memory cache with TTL
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export const cache = new Cache();

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: (limit, offset, filters) => `products:${limit}:${offset}:${JSON.stringify(filters)}`,
  PRODUCT: (id) => `product:${id}`,
  CATEGORIES: 'categories',
  TRENDING: (limit) => `trending:${limit}`,
  POPULAR: (limit) => `popular:${limit}`,
  RECOMMENDATIONS: (productId, limit) => `recommendations:${productId}:${limit}`,
};

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  PRODUCTS: 300, // 5 minutes
  PRODUCT: 600, // 10 minutes
  CATEGORIES: 3600, // 1 hour
  TRENDING: 1800, // 30 minutes
  POPULAR: 1800, // 30 minutes
  RECOMMENDATIONS: 600, // 10 minutes
};
