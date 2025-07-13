import { storageAdapter } from '../storage/StorageAdapter.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check storage health
    const storageHealth = await storageAdapter.healthCheck();
    
    // Get basic system info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    // Determine overall health
    const isHealthy = storageHealth.healthy;

    const response = {
      healthy: isHealthy,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'SIMPLE',
      services: {
        storage: storageHealth,
        api: {
          healthy: true,
          timestamp: new Date().toISOString()
        }
      },
      system: systemInfo
    };

    const statusCode = isHealthy ? 200 : 503;
    
    console.log(`🏥 Health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    return res.status(statusCode).json(response);
  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(503).json({
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
}