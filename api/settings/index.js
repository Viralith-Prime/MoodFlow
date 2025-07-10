import { storageAdapter } from '../storage/StorageAdapter.js';
import { authEngine } from '../auth/CustomAuthEngine.js';
import { z } from 'zod';

const withErrorHandling = (handler) => async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }
    
    return await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'moodflow-super-secure-jwt-key-production-2024'
);

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.userId) {
      return null;
    }
    const user = await storage.get(`user:${payload.userId}`);
    return user;
  } catch (error) {
    return null;
  }
}

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notifications: z.boolean().optional(),
  privacy: z.enum(['public', 'private', 'friends']).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  moodReminders: z.boolean().optional(),
  reminderFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  dataExport: z.boolean().optional(),
  shareLocation: z.boolean().optional(),
  analyticsEnabled: z.boolean().optional()
});

const handler = async (req, res) => {
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - Valid authentication required' });
  }

  try {
    if (req.method === 'GET') {
      // Get user settings
      const userSettings = await storage.get(`settings:${user.id}`) || {
        theme: 'light',
        notifications: true,
        privacy: 'private',
        language: 'en',
        timezone: 'UTC',
        moodReminders: true,
        reminderFrequency: 'daily',
        dataExport: false,
        shareLocation: false,
        analyticsEnabled: true
      };

      return res.status(200).json({ 
        success: true,
        settings: userSettings 
      });
    }

    if (req.method === 'PUT') {
      if (!req.body) {
        return res.status(400).json({ error: 'Request body is required' });
      }

      const validation = settingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      // Get current settings
      const currentSettings = await storage.get(`settings:${user.id}`) || {};
      
      // Merge with new settings
      const updatedSettings = {
        ...currentSettings,
        ...validation.data,
        updatedAt: new Date().toISOString()
      };

      // Save settings with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await storage.set(`settings:${user.id}`, updatedSettings);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to save settings after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      console.log(`⚙️ Settings updated for user ${user.id}`);

      return res.status(200).json({ 
        success: true,
        settings: updatedSettings,
        message: 'Settings updated successfully'
      });
    }

    if (req.method === 'DELETE') {
      // Reset settings to defaults
      const defaultSettings = {
        theme: 'light',
        notifications: true,
        privacy: 'private',
        language: 'en',
        timezone: 'UTC',
        moodReminders: true,
        reminderFrequency: 'daily',
        dataExport: false,
        shareLocation: false,
        analyticsEnabled: true,
        updatedAt: new Date().toISOString()
      };

      await storage.set(`settings:${user.id}`, defaultSettings);

      console.log(`🔄 Settings reset to defaults for user ${user.id}`);

      return res.status(200).json({ 
        success: true,
        settings: defaultSettings,
        message: 'Settings reset to defaults'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Settings API error:', error);
    
    if (error.message.includes('Failed to save settings')) {
      return res.status(503).json({ 
        error: 'Failed to save settings. Please try again.' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);