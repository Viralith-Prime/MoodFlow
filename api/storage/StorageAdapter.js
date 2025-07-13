/**
 * 🏗️ MoodFlow Storage Adapter Interface
 * 
 * This adapter provides a unified interface for both:
 * - Custom in-memory storage engine (for caching)
 * - Vercel Postgres (for persistence)
 * 
 * Features:
 * - Automatic cache warming
 * - Smart sync between layers
 * - Fallback mechanisms
 * - Performance optimization
 */

import { storage as customStorage } from './index.js';

// Optional Postgres import - will be undefined if not available
let sql = null;

class StorageAdapter {
  constructor(config = {}) {
    this.config = {
      enableCache: config.enableCache !== false,
      enablePersistence: config.enablePersistence !== false,
      cacheTTL: config.cacheTTL || 5 * 60 * 1000, // 5 minutes
      syncInterval: config.syncInterval || 30 * 1000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      ...config
    };
    
    this.cache = new Map();
    this.pendingSync = new Map();
    this.syncQueue = [];
    this.isInitialized = false;
    
    // Initialize database tables
    this.initDatabase();
  }

  async initDatabase() {
    try {
      // Try to initialize Postgres if available
      if (sql) {
        try {
          // Create users table
          await sql`
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(255) PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              username VARCHAR(255) NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              last_login TIMESTAMP,
              login_attempts INTEGER DEFAULT 0,
              account_locked BOOLEAN DEFAULT FALSE,
              lockout_expiry TIMESTAMP,
              metadata JSONB
            )
          `;

          // Create moods table
          await sql`
            CREATE TABLE IF NOT EXISTS moods (
              id VARCHAR(255) PRIMARY KEY,
              user_id VARCHAR(255) NOT NULL,
              mood VARCHAR(50) NOT NULL,
              notes TEXT,
              location JSONB,
              timestamp TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `;

          // Create settings table
          await sql`
            CREATE TABLE IF NOT EXISTS settings (
              user_id VARCHAR(255) PRIMARY KEY,
              theme VARCHAR(20) DEFAULT 'light',
              notifications BOOLEAN DEFAULT TRUE,
              privacy VARCHAR(20) DEFAULT 'private',
              language VARCHAR(10) DEFAULT 'en',
              timezone VARCHAR(50) DEFAULT 'UTC',
              mood_reminders BOOLEAN DEFAULT TRUE,
              reminder_frequency VARCHAR(20) DEFAULT 'daily',
              data_export BOOLEAN DEFAULT FALSE,
              share_location BOOLEAN DEFAULT FALSE,
              analytics_enabled BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `;

          // Create auth_tokens table for custom auth system
          await sql`
            CREATE TABLE IF NOT EXISTS auth_tokens (
              id VARCHAR(255) PRIMARY KEY,
              user_id VARCHAR(255) NOT NULL,
              token_hash VARCHAR(255) NOT NULL,
              token_type VARCHAR(50) NOT NULL,
              expires_at TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              last_used TIMESTAMP,
              device_info JSONB,
              ip_address VARCHAR(45),
              is_active BOOLEAN DEFAULT TRUE,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `;

          // Create audit_log table
          await sql`
            CREATE TABLE IF NOT EXISTS audit_log (
              id SERIAL PRIMARY KEY,
              user_id VARCHAR(255),
              action VARCHAR(100) NOT NULL,
              resource_type VARCHAR(50),
              resource_id VARCHAR(255),
              ip_address VARCHAR(45),
              user_agent TEXT,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              metadata JSONB
            )
          `;

          console.log('✅ Postgres database tables initialized successfully');
          this.config.enablePersistence = true;
        } catch (postgresError) {
          console.warn('⚠️ Postgres initialization failed, falling back to local storage:', postgresError.message);
          this.config.enablePersistence = false;
        }
      } else {
        console.log('ℹ️ Postgres not available, using local storage only');
        this.config.enablePersistence = false;
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      // Don't throw error, just disable persistence
      this.config.enablePersistence = false;
      this.isInitialized = true;
    }
  }

  // Unified get method with cache and persistence
  async get(key, options = {}) {
    const { useCache = true, usePersistence = true } = options;
    
    try {
      // Try cache first
      if (useCache && this.config.enableCache) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
          return cached.data;
        }
      }

      // Try custom storage engine
      if (this.config.enableCache) {
        try {
          const customData = await customStorage.get(key);
          if (customData) {
            // Update cache
            this.cache.set(key, {
              data: customData,
              timestamp: Date.now()
            });
            return customData;
          }
        } catch (error) {
          console.warn('Custom storage get failed:', error);
        }
      }

      // Try persistence layer
      if (usePersistence && this.config.enablePersistence) {
        const persistentData = await this.getFromPersistence(key);
        if (persistentData) {
          // Update cache and custom storage
          if (this.config.enableCache) {
            this.cache.set(key, {
              data: persistentData,
              timestamp: Date.now()
            });
            await customStorage.set(key, persistentData);
          }
          return persistentData;
        }
      }

      return null;
    } catch (error) {
      console.error('Storage adapter get error:', error);
      throw error;
    }
  }

  // Unified set method with cache and persistence
  async set(key, value, options = {}) {
    const { useCache = true, usePersistence = true, sync = true } = options;
    
    try {
      // Update cache
      if (useCache && this.config.enableCache) {
        this.cache.set(key, {
          data: value,
          timestamp: Date.now()
        });
      }

      // Update custom storage
      if (this.config.enableCache) {
        try {
          await customStorage.set(key, value);
        } catch (error) {
          console.warn('Custom storage set failed:', error);
        }
      }

      // Update persistence layer
      if (usePersistence && this.config.enablePersistence) {
        await this.setToPersistence(key, value);
      }

      // Queue for sync if needed
      if (sync) {
        this.queueSync(key, value);
      }

      return true;
    } catch (error) {
      console.error('Storage adapter set error:', error);
      throw error;
    }
  }

  // Unified delete method
  async del(key, options = {}) {
    const { useCache = true, usePersistence = true } = options;
    
    try {
      // Remove from cache
      if (useCache && this.config.enableCache) {
        this.cache.delete(key);
      }

      // Remove from custom storage
      if (this.config.enableCache) {
        try {
          await customStorage.del(key);
        } catch (error) {
          console.warn('Custom storage del failed:', error);
        }
      }

      // Remove from persistence
      if (usePersistence && this.config.enablePersistence) {
        await this.delFromPersistence(key);
      }

      return true;
    } catch (error) {
      console.error('Storage adapter del error:', error);
      throw error;
    }
  }

  // Persistence layer methods
  async getFromPersistence(key) {
    try {
      if (key.startsWith('user:')) {
        const userId = key.replace('user:', '');
        const result = await sql`
          SELECT * FROM users WHERE id = ${userId}
        `;
        return result.rows[0] || null;
      }
      
      if (key.startsWith('user:email:')) {
        const email = key.replace('user:email:', '');
        const result = await sql`
          SELECT id FROM users WHERE email = ${email}
        `;
        return result.rows[0]?.id || null;
      }
      
      if (key.startsWith('moods:')) {
        const userId = key.replace('moods:', '');
        const result = await sql`
          SELECT * FROM moods WHERE user_id = ${userId} ORDER BY timestamp DESC
        `;
        return result.rows;
      }
      
      if (key.startsWith('settings:')) {
        const userId = key.replace('settings:', '');
        const result = await sql`
          SELECT * FROM settings WHERE user_id = ${userId}
        `;
        return result.rows[0] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Persistence get error:', error);
      return null;
    }
  }

  async setToPersistence(key, value) {
    try {
      if (key.startsWith('user:')) {
        const userId = key.replace('user:', '');
        await sql`
          INSERT INTO users (id, email, username, password_hash, metadata)
          VALUES (${userId}, ${value.email}, ${value.username}, ${value.password}, ${JSON.stringify(value.metadata || {})})
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            username = EXCLUDED.username,
            password_hash = EXCLUDED.password_hash,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
      
      if (key.startsWith('user:email:')) {
        const email = key.replace('user:email:', '');
        const userId = value;
        await sql`
          INSERT INTO users (id, email) VALUES (${userId}, ${email})
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        `;
      }
      
      if (key.startsWith('moods:')) {
        const userId = key.replace('moods:', '');
        // Clear existing moods for user
        await sql`DELETE FROM moods WHERE user_id = ${userId}`;
        
        // Insert new moods
        if (Array.isArray(value) && value.length > 0) {
          for (const mood of value) {
            await sql`
              INSERT INTO moods (id, user_id, mood, notes, location, timestamp)
              VALUES (${mood.id}, ${userId}, ${mood.mood}, ${mood.notes || ''}, ${JSON.stringify(mood.location || null)}, ${mood.timestamp})
            `;
          }
        }
      }
      
      if (key.startsWith('settings:')) {
        const userId = key.replace('settings:', '');
        await sql`
          INSERT INTO settings (user_id, theme, notifications, privacy, language, timezone, mood_reminders, reminder_frequency, data_export, share_location, analytics_enabled)
          VALUES (${userId}, ${value.theme}, ${value.notifications}, ${value.privacy}, ${value.language}, ${value.timezone}, ${value.moodReminders}, ${value.reminderFrequency}, ${value.dataExport}, ${value.shareLocation}, ${value.analyticsEnabled})
          ON CONFLICT (user_id) DO UPDATE SET
            theme = EXCLUDED.theme,
            notifications = EXCLUDED.notifications,
            privacy = EXCLUDED.privacy,
            language = EXCLUDED.language,
            timezone = EXCLUDED.timezone,
            mood_reminders = EXCLUDED.mood_reminders,
            reminder_frequency = EXCLUDED.reminder_frequency,
            data_export = EXCLUDED.data_export,
            share_location = EXCLUDED.share_location,
            analytics_enabled = EXCLUDED.analytics_enabled,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
    } catch (error) {
      console.error('Persistence set error:', error);
      throw error;
    }
  }

  async delFromPersistence(key) {
    try {
      if (key.startsWith('user:')) {
        const userId = key.replace('user:', '');
        await sql`DELETE FROM users WHERE id = ${userId}`;
      }
      
      if (key.startsWith('moods:')) {
        const userId = key.replace('moods:', '');
        await sql`DELETE FROM moods WHERE user_id = ${userId}`;
      }
      
      if (key.startsWith('settings:')) {
        const userId = key.replace('settings:', '');
        await sql`DELETE FROM settings WHERE user_id = ${userId}`;
      }
    } catch (error) {
      console.error('Persistence del error:', error);
      throw error;
    }
  }

  // Sync management
  queueSync(key, value) {
    this.syncQueue.push({ key, value, timestamp: Date.now() });
    
    // Process sync queue if not already processing
    if (!this.processingSync) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue() {
    if (this.processingSync || this.syncQueue.length === 0) return;
    
    this.processingSync = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const batch = this.syncQueue.splice(0, 10); // Process in batches
        
        for (const { key, value } of batch) {
          try {
            await this.setToPersistence(key, value);
          } catch (error) {
            console.error('Sync error for key:', key, error);
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processingSync = false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      // Test database connection
      await sql`SELECT 1`;
      
      // Test custom storage
      const customHealth = await customStorage.healthCheck();
      
      return {
        healthy: true,
        database: 'connected',
        customStorage: customHealth.healthy,
        cacheSize: this.cache.size,
        syncQueueSize: this.syncQueue.length,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Cache management
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
const storageAdapter = new StorageAdapter({
  enableCache: true,
  enablePersistence: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  syncInterval: 30 * 1000 // 30 seconds
});

export { storageAdapter };
export default storageAdapter;