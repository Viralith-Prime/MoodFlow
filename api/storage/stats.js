import { storageAdapter } from './StorageAdapter.js';

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
    // Get storage stats
    const stats = await storageAdapter.getStats();
    
    const response = {
      success: true,
      stats: {
        ...stats,
        timestamp: new Date().toISOString(),
        environment: 'SIMPLE'
      }
    };

    console.log(`📊 Storage stats retrieved`);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Storage stats error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}