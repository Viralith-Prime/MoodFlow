/**
 * Simple Storage Adapter - No Postgres, No JWT
 * Basic storage functionality for the working app
 */

import { simpleStorage } from './SimpleStorage.js';

class StorageAdapter {
  constructor(config = {}) {
    this.config = {
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      ...config
    };
    
    this.cache = new Map();
    this.isInitialized = false;
  }

  async initDatabase() {
    try {
      console.log('ℹ️ Using simple storage system');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      this.isInitialized = true; // Still mark as initialized to prevent errors
    }
  }

  // Simple get method
  async get(key, options = {}) {
    try {
      // Try cache first
      if (this.config.enableCache) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
          return cached.data;
        }
      }

      // Get from simple storage
      const data = await simpleStorage.get(key);
      
      if (data && this.config.enableCache) {
        // Update cache
        this.cache.set(key, {
          data: data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.warn('Storage get failed:', error);
      return null;
    }
  }

  // Simple set method
  async set(key, value, options = {}) {
    try {
      // Store in simple storage
      await simpleStorage.set(key, value);
      
      // Update cache
      if (this.config.enableCache) {
        this.cache.set(key, {
          data: value,
          timestamp: Date.now()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Storage set failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Simple delete method
  async del(key, options = {}) {
    try {
      // Delete from simple storage
      await simpleStorage.del(key);
      
      // Remove from cache
      this.cache.delete(key);
      
      return { success: true };
    } catch (error) {
      console.error('Storage delete failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Health check
  async healthCheck() {
    try {
      return await simpleStorage.healthCheck();
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now(),
        version: '1.0'
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
const storageAdapter = new StorageAdapter();

export { storageAdapter };
export default storageAdapter;