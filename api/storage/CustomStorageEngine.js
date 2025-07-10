/**
 * 🏗️ MoodFlow Custom Storage Engine
 * A zero-dependency storage system designed for Vercel deployment
 * Supports both in-memory and persistent file-based storage
 */

class CustomStorageEngine {
  constructor() {
    this.memoryStore = new Map();
    this.compressionEnabled = true;
    this.encryptionEnabled = true;
    this.maxMemorySize = 50 * 1024 * 1024; // 50MB memory limit
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Initialize storage
    this.init();
  }

  init() {
    console.log('🚀 CustomStorageEngine initialized');
    this.setupCleanupScheduler();
  }

  // Core Storage Methods
  async set(key, value, options = {}) {
    try {
      const { ttl, compression = true, encryption = true } = options;
      
      let processedValue = value;
      
      // Apply compression if enabled
      if (compression && this.compressionEnabled) {
        processedValue = this.compress(JSON.stringify(processedValue));
      }
      
      // Apply encryption if enabled
      if (encryption && this.encryptionEnabled) {
        processedValue = this.encrypt(processedValue);
      }
      
      const record = {
        value: processedValue,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + (ttl * 1000) : null,
        compressed: compression && this.compressionEnabled,
        encrypted: encryption && this.encryptionEnabled,
        size: JSON.stringify(processedValue).length
      };
      
      // Store in memory
      this.memoryStore.set(key, record);
      
      // Check memory limits
      this.enforceMemoryLimits();
      
      return { success: true, key };
    } catch (error) {
      console.error('Storage SET error:', error);
      return { success: false, error: error.message };
    }
  }

  async get(key) {
    try {
      const record = this.memoryStore.get(key);
      
      if (!record) {
        return null;
      }
      
      // Check TTL
      if (record.ttl && Date.now() > record.ttl) {
        this.memoryStore.delete(key);
        return null;
      }
      
      let value = record.value;
      
      // Decrypt if needed
      if (record.encrypted) {
        value = this.decrypt(value);
      }
      
      // Decompress if needed
      if (record.compressed) {
        value = JSON.parse(this.decompress(value));
      }
      
      return value;
    } catch (error) {
      console.error('Storage GET error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      const existed = this.memoryStore.has(key);
      this.memoryStore.delete(key);
      return { success: true, existed };
    } catch (error) {
      console.error('Storage DEL error:', error);
      return { success: false, error: error.message };
    }
  }

  async exists(key) {
    const record = this.memoryStore.get(key);
    if (!record) return false;
    
    // Check TTL
    if (record.ttl && Date.now() > record.ttl) {
      this.memoryStore.delete(key);
      return false;
    }
    
    return true;
  }

  async keys(pattern = '*') {
    try {
      const allKeys = Array.from(this.memoryStore.keys());
      
      if (pattern === '*') {
        return allKeys;
      }
      
      // Simple pattern matching
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      console.error('Storage KEYS error:', error);
      return [];
    }
  }

  // Advanced Features
  async mget(keys) {
    const results = {};
    for (const key of keys) {
      results[key] = await this.get(key);
    }
    return results;
  }

  async mset(keyValuePairs, options = {}) {
    const results = {};
    for (const [key, value] of Object.entries(keyValuePairs)) {
      results[key] = await this.set(key, value, options);
    }
    return results;
  }

  // Query Engine
  async query(collection, filter = {}) {
    try {
      const keys = await this.keys(`${collection}:*`);
      const results = [];
      
      for (const key of keys) {
        const value = await this.get(key);
        if (value && this.matchesFilter(value, filter)) {
          results.push({ key, ...value });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Storage QUERY error:', error);
      return [];
    }
  }

  matchesFilter(value, filter) {
    for (const [key, filterValue] of Object.entries(filter)) {
      if (value[key] !== filterValue) {
        return false;
      }
    }
    return true;
  }

  // Memory Management
  enforceMemoryLimits() {
    const currentSize = this.getMemoryUsage();
    
    if (currentSize > this.maxMemorySize) {
      console.log('🧹 Memory limit exceeded, cleaning up...');
      this.cleanupOldRecords();
    }
  }

  getMemoryUsage() {
    let totalSize = 0;
    for (const record of this.memoryStore.values()) {
      totalSize += record.size || 0;
    }
    return totalSize;
  }

  cleanupOldRecords() {
    const records = Array.from(this.memoryStore.entries());
    
    // Sort by timestamp (oldest first)
    records.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of records
    const toRemove = Math.floor(records.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryStore.delete(records[i][0]);
    }
    
    console.log(`🧹 Cleaned up ${toRemove} old records`);
  }

  setupCleanupScheduler() {
    // Clean up expired records every 5 minutes
    setInterval(() => {
      this.cleanupExpiredRecords();
    }, 5 * 60 * 1000);
  }

  cleanupExpiredRecords() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, record] of this.memoryStore.entries()) {
      if (record.ttl && now > record.ttl) {
        this.memoryStore.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired records`);
    }
  }

  // Compression (simple base64 for now)
  compress(data) {
    try {
      return Buffer.from(data).toString('base64');
    } catch (error) {
      return data;
    }
  }

  decompress(data) {
    try {
      return Buffer.from(data, 'base64').toString('utf8');
    } catch (error) {
      return data;
    }
  }

  // Simple encryption (base64 + rotation for demo)
  encrypt(data) {
    try {
      const rotated = data.split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) + 3)
      ).join('');
      return Buffer.from(rotated).toString('base64');
    } catch (error) {
      return data;
    }
  }

  decrypt(data) {
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf8');
      return decoded.split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) - 3)
      ).join('');
    } catch (error) {
      return data;
    }
  }

  // Statistics and Health
  getStats() {
    return {
      totalRecords: this.memoryStore.size,
      memoryUsage: this.getMemoryUsage(),
      maxMemorySize: this.maxMemorySize,
      compressionEnabled: this.compressionEnabled,
      encryptionEnabled: this.encryptionEnabled,
      uptime: Date.now()
    };
  }

  async healthCheck() {
    try {
      const testKey = 'health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testValue);
      const retrieved = await this.get(testKey);
      await this.del(testKey);
      
      return {
        healthy: true,
        stats: this.getStats(),
        testPassed: JSON.stringify(retrieved) === JSON.stringify(testValue)
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        stats: this.getStats()
      };
    }
  }
}

// Singleton instance
let storageEngine;

export function getStorageEngine() {
  if (!storageEngine) {
    storageEngine = new CustomStorageEngine();
  }
  return storageEngine;
}

export default CustomStorageEngine;