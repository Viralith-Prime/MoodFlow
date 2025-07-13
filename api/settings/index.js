import { storageAdapter } from '../storage/StorageAdapter.js';
import { z } from 'zod';

// Comprehensive error handling wrapper
const withErrorHandling = (handler) => async (req, res) => {
  try {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Handle preflight requests
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

// Rate limiting
const rateLimitStore = new Map();
const checkRateLimit = (identifier, limit = 50, window = 15 * 60 * 1000) => {
  const now = Date.now();
  const requests = rateLimitStore.get(identifier) || [];
  const recentRequests = requests.filter(time => now - time < window);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);
  return true;
};

// Simple user ID generation for anonymous users
function getUserId(req) {
  // Use IP address as user identifier for anonymous users
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'anonymous';
  return `user_${clientIP.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

// Validation schemas
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  notifications: z.boolean().default(true),
  privacy: z.enum(['private', 'public', 'friends']).default('private'),
  language: z.string().max(10).default('en'),
  timezone: z.string().max(50).default('UTC'),
  moodReminders: z.boolean().default(true),
  reminderFrequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  dataExport: z.boolean().default(false),
  shareLocation: z.boolean().default(false),
  analyticsEnabled: z.boolean().default(true)
});

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notifications: z.boolean().optional(),
  privacy: z.enum(['private', 'public', 'friends']).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  moodReminders: z.boolean().optional(),
  reminderFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  dataExport: z.boolean().optional(),
  shareLocation: z.boolean().optional(),
  analyticsEnabled: z.boolean().optional()
});

// Default settings
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const handler = async (req, res) => {
  try {
    // Get user ID (anonymous for now)
    const userId = getUserId(req);

    // Rate limiting per user
    if (!checkRateLimit(`settings:${userId}`, 50, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again in 15 minutes.' 
      });
    }

    const { method } = req;
    const maxRetries = 3;

    if (method === 'GET') {
      // Get user settings
      let retryCount = 0;
      let userSettings = null;

      while (retryCount < maxRetries) {
        try {
          userSettings = await storageAdapter.get(`settings:${userId}`);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to retrieve settings after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      // Return default settings if none exist
      if (!userSettings) {
        return res.status(200).json({ 
          success: true,
          settings: defaultSettings,
          isDefault: true
        });
      }

      console.log(`⚙️ Retrieved settings for user ${userId}`);

      return res.status(200).json({ 
        success: true,
        settings: userSettings,
        isDefault: false
      });
    }

    if (method === 'POST') {
      // Create new settings
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

      const newSettings = {
        ...defaultSettings,
        ...validation.data,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save with retry logic
      let retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await storageAdapter.set(`settings:${userId}`, newSettings);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to save settings after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      console.log(`✅ Settings created successfully for user ${userId}`);

      return res.status(201).json({ 
        success: true,
        settings: newSettings, 
        message: 'Settings created successfully'
      });
    }

    if (method === 'PUT') {
      // Update existing settings
      if (!req.body) {
        return res.status(400).json({ error: 'Request body is required' });
      }

      const validation = updateSettingsSchema.safeParse(req.body);
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
      let retryCount = 0;
      let userSettings = null;

      while (retryCount < maxRetries) {
        try {
          userSettings = await storageAdapter.get(`settings:${userId}`);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to retrieve settings for update');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      // Use default settings if none exist
      const currentSettings = userSettings || defaultSettings;

      const updatedSettings = {
        ...currentSettings,
        ...validation.data,
        updatedAt: new Date().toISOString()
      };

      // Save with retry logic
      retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await storageAdapter.set(`settings:${userId}`, updatedSettings);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to update settings after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      console.log(`📝 Settings updated successfully for user ${userId}`);

      return res.status(200).json({ 
        success: true,
        settings: updatedSettings, 
        message: 'Settings updated successfully'
      });
    }

    if (method === 'DELETE') {
      // Reset settings to default
      let retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await storageAdapter.del(`settings:${userId}`);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to reset settings after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      console.log(`🔄 Settings reset to default for user ${userId}`);

      return res.status(200).json({ 
        success: true,
        settings: defaultSettings,
        message: 'Settings reset to default successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Settings API error:', error);
    
    // Return appropriate error response
    if (error.message.includes('Failed to retrieve settings')) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable. Please try again.' 
      });
    }
    
    if (error.message.includes('Failed to save settings') || error.message.includes('Failed to update settings') || error.message.includes('Failed to reset settings')) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable. Please try again.' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);