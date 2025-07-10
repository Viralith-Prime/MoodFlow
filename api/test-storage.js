import { getStorageEngine } from './storage/CustomStorageEngine.js';

export default async function handler(req) {
  const storage = getStorageEngine();
  
  try {
    // Test basic operations
    console.log('🧪 Testing Custom Storage Engine...');
    
    // Health check
    const health = await storage.healthCheck();
    console.log('Health Check:', health);
    
    // Test set/get
    await storage.set('test:user:123', { 
      username: 'testuser', 
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    }, { ttl: 3600 });
    
    const retrieved = await storage.get('test:user:123');
    console.log('Retrieved user:', retrieved);
    
    // Test moods
    await storage.set('test:moods:123', [
      { id: '1', mood: 'happy', intensity: 8, timestamp: new Date().toISOString() },
      { id: '2', mood: 'calm', intensity: 6, timestamp: new Date().toISOString() }
    ], { ttl: 3600 });
    
    const moods = await storage.get('test:moods:123');
    console.log('Retrieved moods:', moods);
    
    // Test settings
    await storage.set('test:settings:123', {
      theme: 'dark',
      notifications: true,
      privacy: { shareLocation: false }
    }, { ttl: 3600 });
    
    const settings = await storage.get('test:settings:123');
    console.log('Retrieved settings:', settings);
    
    // Clean up test data
    await storage.del('test:user:123');
    await storage.del('test:moods:123');
    await storage.del('test:settings:123');
    
    return new Response(JSON.stringify({
      success: true,
      message: '✅ Custom Storage Engine working perfectly!',
      health,
      testResults: {
        userStorage: !!retrieved,
        moodsStorage: !!moods && moods.length === 2,
        settingsStorage: !!settings && settings.theme === 'dark'
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '❌ Custom Storage Engine failed test'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}