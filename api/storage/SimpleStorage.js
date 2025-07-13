/**
 * Simple Storage System - No Postgres, No JWT, Just Local Storage
 * This provides the basic storage functionality without complex dependencies
 */

class SimpleStorage {
  constructor() {
    this.store = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return { success: true };
    
    console.log('🚀 Initializing Simple Storage System...');
    
    try {
      this.initialized = true;
      console.log('✅ Simple Storage System ready');
      return { success: true };
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async set(key, value, options = {}) {
    await this.init();
    
    try {
      // Store in memory
      this.store.set(key, {
        data: value,
        timestamp: Date.now(),
        metadata: {
          size: JSON.stringify(value).length,
          type: typeof value
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Storage set error:', error);
      return { success: false, error: error.message };
    }
  }

  async get(key, options = {}) {
    await this.init();
    
    try {
      const record = this.store.get(key);
      if (!record) {
        return null;
      }
      
      return record.data;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  async del(key, options = {}) {
    await this.init();
    
    try {
      const deleted = this.store.delete(key);
      return { success: deleted };
    } catch (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }
  }

  async exists(key) {
    await this.init();
    return this.store.has(key);
  }

  async keys(pattern = '*') {
    await this.init();
    
    try {
      const allKeys = Array.from(this.store.keys());
      
      if (pattern === '*') {
        return allKeys;
      }
      
      // Simple pattern matching
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  }

  async healthCheck() {
    try {
      await this.init();
      
      const testKey = `health_check_${Date.now()}`;
      const testData = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testData);
      const retrieved = await this.get(testKey);
      await this.del(testKey);
      
      const isHealthy = JSON.stringify(testData) === JSON.stringify(retrieved);
      
      return {
        healthy: isHealthy,
        timestamp: Date.now(),
        version: '1.0',
        environment: 'SIMPLE',
        testPassed: isHealthy
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now(),
        version: '1.0'
      };
    }
  }

  async getStats() {
    await this.init();
    
    return {
      storage: {
        totalKeys: this.store.size,
        memoryUsage: this.calculateMemoryUsage()
      },
      performance: {
        avgReadTime: 0,
        avgWriteTime: 0,
        errorRate: 0
      },
      operations: {
        reads: 0,
        writes: 0,
        deletes: 0,
        errors: 0
      },
      health: {
        isHealthy: true,
        lastCheck: Date.now(),
        uptime: Date.now()
      },
      config: {
        compressionEnabled: false,
        encryptionEnabled: false,
        transactionSupport: false,
        maxMemorySize: 50 * 1024 * 1024
      }
    };
  }

  calculateMemoryUsage() {
    let totalSize = 0;
    
    for (const record of this.store.values()) {
      totalSize += record.metadata?.size || 0;
    }
    
    return totalSize;
  }
}

// Create and export singleton instance
const simpleStorage = new SimpleStorage();

export { simpleStorage };
export default simpleStorage;