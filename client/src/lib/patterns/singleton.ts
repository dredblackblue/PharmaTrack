// Singleton Pattern Implementation

// AppConfig Singleton for application-wide configuration
export class AppConfig {
  private static instance: AppConfig;
  private config: Record<string, any> = {};
  
  // Default configuration values
  private defaultConfig: Record<string, any> = {
    apiUrl: "/api",
    theme: "light",
    dateFormat: "MM/DD/YYYY",
    currencyFormat: "USD",
    pageSize: 10,
    maxNotifications: 100,
    stockThresholds: {
      critical: 5,
      low: 10
    },
    expiryWarningDays: 30,
    refreshInterval: 60000, // 1 minute in milliseconds
  };
  
  // Private constructor to prevent direct instantiation
  private constructor() {
    // Initialize with default configuration
    this.config = { ...this.defaultConfig };
    
    // Load configuration from localStorage if available
    this.loadFromStorage();
  }
  
  // Get the singleton instance
  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    
    return AppConfig.instance;
  }
  
  // Get a configuration value
  get<T>(key: string, defaultValue?: T): T {
    return key in this.config ? this.config[key] : defaultValue;
  }
  
  // Set a configuration value
  set(key: string, value: any): void {
    this.config[key] = value;
    this.saveToStorage();
  }
  
  // Update multiple configuration values at once
  update(configUpdates: Record<string, any>): void {
    this.config = { ...this.config, ...configUpdates };
    this.saveToStorage();
  }
  
  // Reset configuration to defaults
  reset(): void {
    this.config = { ...this.defaultConfig };
    this.saveToStorage();
  }
  
  // Load configuration from localStorage
  private loadFromStorage(): void {
    try {
      const storedConfig = localStorage.getItem('appConfig');
      if (storedConfig) {
        this.config = { ...this.defaultConfig, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Failed to load configuration from localStorage:', error);
    }
  }
  
  // Save configuration to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('appConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save configuration to localStorage:', error);
    }
  }
  
  // Get all configuration
  getAll(): Record<string, any> {
    return { ...this.config };
  }
}

// API Cache Singleton for caching API responses
export class ApiCache {
  private static instance: ApiCache;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  
  // Default cache TTL (10 minutes in milliseconds)
  private defaultTTL: number = 10 * 60 * 1000;
  
  // Private constructor to prevent direct instantiation
  private constructor() {
    // Setup cache cleanup interval
    setInterval(() => this.cleanup(), 60000); // Clean up every minute
  }
  
  // Get the singleton instance
  public static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache();
    }
    
    return ApiCache.instance;
  }
  
  // Get a cached value by key
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if the item has expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data as T;
  }
  
  // Set a value in the cache with an optional TTL
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }
  
  // Remove a specific item from the cache
  remove(key: string): boolean {
    return this.cache.delete(key);
  }
  
  // Clear the entire cache
  clear(): void {
    this.cache.clear();
  }
  
  // Get all keys in the cache
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  // Check if a key exists in the cache (and is not expired)
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Clean up expired cache items
  private cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    });
  }
  
  // Set the default TTL for cache items
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
  
  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Example usage:
// const config = AppConfig.getInstance();
// config.set('theme', 'dark');
// 
// const cache = ApiCache.getInstance();
// cache.set('medicines', medicinesList, 5 * 60 * 1000); // Cache for 5 minutes
// const medicines = cache.get('medicines');