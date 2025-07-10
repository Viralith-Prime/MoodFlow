/**
 * 🏗️ MoodFlow Enterprise Storage Engine v2.0
 * Complete zero-dependency storage system with enterprise features
 */

import { DataProcessor } from './core/DataProcessor.js';
import { PersistenceManager } from './core/PersistenceManager.js';
import { CacheManager } from './core/CacheManager.js';
import { IndexManager } from './core/IndexManager.js';
import { TransactionManager } from './core/TransactionManager.js';
import { SecurityManager } from './core/SecurityManager.js';
import { CompressionEngine } from './core/CompressionEngine.js';
import { EncryptionEngine } from './core/EncryptionEngine.js';
import { QueryProcessor } from './core/QueryProcessor.js';
import { MetricsCollector } from './core/MetricsCollector.js';
import { BackupManager } from './core/BackupManager.js';
import { ReplicationEngine } from './core/ReplicationEngine.js';
import { LockManager } from './core/LockManager.js';
import { GarbageCollector } from './core/GarbageCollector.js';
import { SchemaValidator } from './core/SchemaValidator.js';
import { AuditLogger } from './core/AuditLogger.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';
import { ConfigurationManager } from './core/ConfigurationManager.js';
import { ErrorHandler } from './core/ErrorHandler.js';
import { EventEmitter } from './core/EventEmitter.js';
import { HealthChecker } from './core/HealthChecker.js';

export class StorageEngine {
  constructor(config = {}) {
    this.config = {
      // Core settings
      maxMemorySize: config.maxMemorySize || 100 * 1024 * 1024,
      maxCacheSize: config.maxCacheSize || 50 * 1024 * 1024,
      maxTransactionSize: config.maxTransactionSize || 10 * 1024 * 1024,
      maxIndexSize: config.maxIndexSize || 25 * 1024 * 1024,
      
      // Performance settings
      batchSize: config.batchSize || 1000,
      flushInterval: config.flushInterval || 5000,
      compactionInterval: config.compactionInterval || 300000,
      gcInterval: config.gcInterval || 60000,
      syncInterval: config.syncInterval || 10000,
      
      // Feature flags
      compressionEnabled: config.compressionEnabled !== false,
      encryptionEnabled: config.encryptionEnabled !== false,
      indexingEnabled: config.indexingEnabled !== false,
      transactionSupport: config.transactionSupport !== false,
      replicationEnabled: config.replicationEnabled || false,
      backupEnabled: config.backupEnabled !== false,
      auditingEnabled: config.auditingEnabled !== false,
      metricsEnabled: config.metricsEnabled !== false,
      
      // Security settings
      encryptionAlgorithm: config.encryptionAlgorithm || 'AES-256-GCM',
      compressionAlgorithm: config.compressionAlgorithm || 'LZ4',
      hashAlgorithm: config.hashAlgorithm || 'SHA-256',
      encryptionKey: config.encryptionKey || this.generateSecureKey(),
      
      // Concurrency settings
      maxConcurrentOps: config.maxConcurrentOps || 1000,
      maxConcurrentTransactions: config.maxConcurrentTransactions || 100,
      lockTimeout: config.lockTimeout || 30000,
      
      // Reliability settings
      walEnabled: config.walEnabled !== false,
      snapshotEnabled: config.snapshotEnabled !== false,
      replicationFactor: config.replicationFactor || 1,
      maxRetries: config.maxRetries || 3,
      
      // Environment settings
      isProduction: process.env.NODE_ENV === 'production',
      isEdgeRuntime: typeof globalThis.EdgeRuntime !== 'undefined',
      debugMode: config.debugMode || false,
      
      ...config
    };

    // State management
    this.isInitialized = false;
    this.isRunning = false;
    this.isShuttingDown = false;
    this.startTime = Date.now();
    this.operationCounter = 0;
    
    // Initialize components
    this.components = {};
    this.metrics = {
      operations: { reads: 0, writes: 0, deletes: 0, queries: 0, transactions: 0 },
      performance: { avgReadTime: 0, avgWriteTime: 0, avgQueryTime: 0, cacheHitRatio: 0 },
      resources: { memoryUsage: 0, cacheSize: 0, indexSize: 0, activeTransactions: 0 },
      errors: { total: 0, rate: 0, lastError: null }
    };
    
    // Initialize with proper error handling
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing MoodFlow Enterprise Storage Engine v2.0...');
      
      // Phase 1: Core components
      await this.initializeComponents();
      
      // Phase 2: Wire dependencies
      await this.wireDependencies();
      
      // Phase 3: Start services
      await this.startServices();
      
      // Phase 4: Load data
      await this.loadPersistedData();
      
      // Phase 5: Validate system
      await this.validateSystem();
      
      this.isInitialized = true;
      this.isRunning = true;
      
      console.log('✅ Storage Engine initialized successfully');
      console.log(`📊 ${Object.keys(this.components).length} components loaded`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Storage Engine initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async initializeComponents() {
    // Core data processing
    this.components.dataProcessor = new DataProcessor(this.config);
    this.components.persistence = new PersistenceManager(this.config);
    this.components.cache = new CacheManager(this.config);
    this.components.indexManager = new IndexManager(this.config);
    
    // Security and validation
    this.components.security = new SecurityManager(this.config);
    this.components.compression = new CompressionEngine(this.config);
    this.components.encryption = new EncryptionEngine(this.config);
    this.components.validator = new SchemaValidator(this.config);
    
    // Transaction and concurrency
    this.components.transactions = new TransactionManager(this.config);
    this.components.lockManager = new LockManager(this.config);
    
    // Query and search
    this.components.queryProcessor = new QueryProcessor(this.config);
    
    // Monitoring and maintenance
    this.components.metrics = new MetricsCollector(this.config);
    this.components.performance = new PerformanceMonitor(this.config);
    this.components.audit = new AuditLogger(this.config);
    this.components.health = new HealthChecker(this.config);
    this.components.gc = new GarbageCollector(this.config);
    
    // High availability
    this.components.backup = new BackupManager(this.config);
    this.components.replication = new ReplicationEngine(this.config);
    
    // Configuration and error handling
    this.components.config = new ConfigurationManager(this.config);
    this.components.errorHandler = new ErrorHandler(this.config);
    this.components.events = new EventEmitter(this.config);
    
    console.log(`🔧 Initialized ${Object.keys(this.components).length} components`);
  }

  async wireDependencies() {
    const { 
      dataProcessor, persistence, cache, indexManager, security, 
      compression, encryption, validator, transactions, lockManager,
      queryProcessor, metrics, performance, audit, health, gc,
      backup, replication, config, errorHandler, events
    } = this.components;

    // Set up interdependencies
    dataProcessor.setDependencies({ compression, encryption, validator });
    persistence.setDependencies({ dataProcessor, lockManager, audit });
    cache.setDependencies({ persistence, metrics, gc });
    indexManager.setDependencies({ persistence, cache, lockManager });
    transactions.setDependencies({ persistence, lockManager, audit });
    queryProcessor.setDependencies({ indexManager, cache, persistence, security });
    backup.setDependencies({ persistence, compression, encryption });
    replication.setDependencies({ persistence, security, audit });
    
    console.log('🔗 Component dependencies wired');
  }

  async startServices() {
    if (this.config.metricsEnabled) await this.components.metrics.start();
    if (this.config.auditingEnabled) await this.components.audit.start();
    if (this.config.gcInterval > 0) await this.components.gc.start();
    if (this.config.replicationEnabled) await this.components.replication.start();
    
    await this.components.performance.start();
    await this.components.health.start();
    
    console.log('🔄 Background services started');
  }

  async loadPersistedData() {
    await this.components.persistence.loadFromStorage();
    await this.components.indexManager.rebuildIndexes();
    await this.components.transactions.recoverTransactions();
    
    console.log('📁 Persisted data loaded');
  }

  async validateSystem() {
    const health = await this.components.health.performSystemCheck();
    if (!health.healthy) {
      throw new Error(`System validation failed: ${health.issues.join(', ')}`);
    }
    console.log('✅ System validation passed');
  }

  // Core Storage Operations
  async set(key, value, options = {}) {
    await this.ensureReady();
    const startTime = performance.now();
    const opId = ++this.operationCounter;
    
    try {
      // Security validation
      await this.components.security.validateAccess('write', key);
      
      // Schema validation
      if (options.schema) {
        await this.components.validator.validate(value, options.schema);
      }
      
      // Transaction handling
      const txId = options.transactionId;
      if (txId) {
        await this.components.transactions.addOperation(txId, 'set', key, value, options);
        return { success: true, transactionId: txId, operationId: opId };
      }
      
      // Process data
      const processed = await this.components.dataProcessor.process(value, options);
      
      // Store data
      const result = await this.components.persistence.store(key, processed, options);
      
      // Update cache
      if (this.config.cachingEnabled) {
        await this.components.cache.set(key, processed, options);
      }
      
      // Update indexes
      if (this.config.indexingEnabled) {
        await this.components.indexManager.updateIndexes(key, value, options);
      }
      
      // Audit logging
      if (this.config.auditingEnabled) {
        await this.components.audit.log('SET', { key, options, operationId: opId });
      }
      
      // Update metrics
      this.updateMetrics('writes', performance.now() - startTime);
      
      return { success: true, key, operationId: opId, version: result.version };
    } catch (error) {
      await this.handleError(error, 'SET', { key, options, operationId: opId });
      throw error;
    }
  }

  async get(key, options = {}) {
    await this.ensureReady();
    const startTime = performance.now();
    const opId = ++this.operationCounter;
    
    try {
      // Security validation
      await this.components.security.validateAccess('read', key);
      
      // Try cache first
      if (this.config.cachingEnabled) {
        const cached = await this.components.cache.get(key, options);
        if (cached) {
          this.updateMetrics('reads', performance.now() - startTime, true);
          return cached;
        }
      }
      
      // Get from persistence
      const result = await this.components.persistence.retrieve(key, options);
      if (!result) return null;
      
      // Process data
      const processed = await this.components.dataProcessor.unprocess(result.data, result.metadata);
      
      // Update cache
      if (this.config.cachingEnabled) {
        await this.components.cache.set(key, processed, options);
      }
      
      // Update metrics
      this.updateMetrics('reads', performance.now() - startTime, false);
      
      return processed;
    } catch (error) {
      await this.handleError(error, 'GET', { key, options, operationId: opId });
      return null;
    }
  }

  async del(key, options = {}) {
    await this.ensureReady();
    const startTime = performance.now();
    const opId = ++this.operationCounter;
    
    try {
      await this.components.security.validateAccess('delete', key);
      
      const txId = options.transactionId;
      if (txId) {
        await this.components.transactions.addOperation(txId, 'del', key, null, options);
        return { success: true, transactionId: txId, operationId: opId };
      }
      
      const result = await this.components.persistence.remove(key, options);
      
      if (this.config.cachingEnabled) {
        await this.components.cache.del(key);
      }
      
      if (this.config.indexingEnabled) {
        await this.components.indexManager.removeFromIndexes(key);
      }
      
      if (this.config.auditingEnabled) {
        await this.components.audit.log('DELETE', { key, options, operationId: opId });
      }
      
      this.updateMetrics('deletes', performance.now() - startTime);
      
      return { success: true, existed: result.existed, operationId: opId };
    } catch (error) {
      await this.handleError(error, 'DELETE', { key, options, operationId: opId });
      throw error;
    }
  }

  async exists(key, options = {}) {
    await this.ensureReady();
    
    try {
      await this.components.security.validateAccess('read', key);
      
      if (this.config.cachingEnabled) {
        const cached = await this.components.cache.exists(key);
        if (cached !== null) return cached;
      }
      
      return await this.components.persistence.exists(key, options);
    } catch (error) {
      return false;
    }
  }

  async keys(pattern = '*', options = {}) {
    await this.ensureReady();
    
    try {
      await this.components.security.validateAccess('read', pattern);
      
      if (this.config.indexingEnabled) {
        return await this.components.indexManager.findKeys(pattern, options);
      }
      
      return await this.components.persistence.getKeys(pattern, options);
    } catch (error) {
      await this.handleError(error, 'KEYS', { pattern, options });
      return [];
    }
  }

  async query(filter, options = {}) {
    await this.ensureReady();
    const startTime = performance.now();
    
    try {
      const result = await this.components.queryProcessor.execute(filter, options);
      this.updateMetrics('queries', performance.now() - startTime);
      return result;
    } catch (error) {
      await this.handleError(error, 'QUERY', { filter, options });
      throw error;
    }
  }

  // Transaction Operations
  async beginTransaction(options = {}) {
    await this.ensureReady();
    return await this.components.transactions.begin(options);
  }

  async commitTransaction(transactionId) {
    await this.ensureReady();
    return await this.components.transactions.commit(transactionId);
  }

  async rollbackTransaction(transactionId) {
    await this.ensureReady();
    return await this.components.transactions.rollback(transactionId);
  }

  // Bulk Operations
  async mget(keys, options = {}) {
    const results = {};
    for (const key of keys) {
      results[key] = await this.get(key, options);
    }
    return results;
  }

  async mset(data, options = {}) {
    const results = {};
    for (const [key, value] of Object.entries(data)) {
      results[key] = await this.set(key, value, options);
    }
    return results;
  }

  // Backup and Recovery
  async createBackup(name, options = {}) {
    await this.ensureReady();
    return await this.components.backup.create(name, options);
  }

  async restoreBackup(name, options = {}) {
    await this.ensureReady();
    return await this.components.backup.restore(name, options);
  }

  async createSnapshot(name) {
    await this.ensureReady();
    return await this.components.persistence.createSnapshot(name);
  }

  // Monitoring and Health
  async getStats() {
    await this.ensureReady();
    
    const componentStats = {};
    for (const [name, component] of Object.entries(this.components)) {
      if (component.getStats) {
        componentStats[name] = await component.getStats();
      }
    }
    
    return {
      engine: {
        isRunning: this.isRunning,
        uptime: Date.now() - this.startTime,
        operationCount: this.operationCounter,
        version: '2.0.0'
      },
      metrics: this.metrics,
      components: componentStats,
      config: {
        compressionEnabled: this.config.compressionEnabled,
        encryptionEnabled: this.config.encryptionEnabled,
        indexingEnabled: this.config.indexingEnabled,
        transactionSupport: this.config.transactionSupport
      }
    };
  }

  async healthCheck() {
    try {
      if (!this.isRunning) {
        return { healthy: false, error: 'Engine not running' };
      }
      
      const testKey = `health_${Date.now()}`;
      const testValue = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testValue);
      const retrieved = await this.get(testKey);
      await this.del(testKey);
      
      const testPassed = JSON.stringify(retrieved) === JSON.stringify(testValue);
      const systemHealth = await this.components.health.getStatus();
      
      return {
        healthy: testPassed && systemHealth.healthy,
        testPassed,
        systemHealth,
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

  // Utility Methods
  async ensureReady() {
    if (!this.isInitialized) {
      const result = await this.initPromise;
      if (!result.success) {
        throw new Error(`Storage engine not ready: ${result.error}`);
      }
    }
    if (!this.isRunning) {
      throw new Error('Storage engine is not running');
    }
  }

  updateMetrics(operation, duration, cacheHit = null) {
    this.metrics.operations[operation]++;
    
    if (operation === 'reads') {
      const total = this.metrics.operations.reads;
      this.metrics.performance.avgReadTime = 
        (this.metrics.performance.avgReadTime * (total - 1) + duration) / total;
      
      if (cacheHit !== null) {
        const hits = this.metrics.performance.cacheHitRatio * (total - 1);
        this.metrics.performance.cacheHitRatio = (hits + (cacheHit ? 1 : 0)) / total;
      }
    } else if (operation === 'writes') {
      const total = this.metrics.operations.writes;
      this.metrics.performance.avgWriteTime = 
        (this.metrics.performance.avgWriteTime * (total - 1) + duration) / total;
    } else if (operation === 'queries') {
      const total = this.metrics.operations.queries;
      this.metrics.performance.avgQueryTime = 
        (this.metrics.performance.avgQueryTime * (total - 1) + duration) / total;
    }
  }

  async handleError(error, operation, context) {
    this.metrics.errors.total++;
    this.metrics.errors.lastError = error.message;
    
    const totalOps = Object.values(this.metrics.operations).reduce((sum, count) => sum + count, 0);
    this.metrics.errors.rate = this.metrics.errors.total / Math.max(totalOps, 1);
    
    if (this.components.errorHandler) {
      await this.components.errorHandler.handle(error, operation, context);
    }
    
    if (this.components.events) {
      this.components.events.emit('error', { error, operation, context });
    }
  }

  generateSecureKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  // Lifecycle Management
  async shutdown(graceful = true) {
    if (this.isShuttingDown) return { success: false, error: 'Already shutting down' };
    
    this.isShuttingDown = true;
    console.log('🛑 Shutting down Storage Engine...');
    
    try {
      if (graceful) {
        await this.components.transactions.completeAllTransactions();
        await this.components.persistence.flush();
      }
      
      for (const component of Object.values(this.components)) {
        if (component.shutdown) {
          await component.shutdown();
        }
      }
      
      this.isRunning = false;
      console.log('✅ Storage Engine shutdown complete');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Shutdown error:', error);
      return { success: false, error: error.message };
    }
  }
}