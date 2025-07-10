import { storage } from '../storage/index.js';
import { jwtVerify } from 'jose';
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
const checkRateLimit = (identifier, limit = 100, window = 15 * 60 * 1000) => {
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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'moodflow-super-secure-jwt-key-production-2024'
);

// Enhanced JWT verification with retry logic
async function getUserFromToken(request) {
  const authHeader = request.headers.authorization || request.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.userId) {
      return null;
    }

    // Get user with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let user;

    while (retryCount < maxRetries) {
      try {
        user = await storage.get(`user:${payload.userId}`);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Failed to get user from token after retries:', error);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }

    return user;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Validation schemas
const moodSchema = z.object({
  mood: z.string()
    .min(1, 'Mood is required')
    .max(50, 'Mood name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Mood contains invalid characters'),
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional()
    .default(''),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().max(200).optional()
  }).optional().nullable(),
  timestamp: z.string()
    .datetime()
    .optional()
});

const updateMoodSchema = z.object({
  mood: z.string()
    .min(1, 'Mood is required')
    .max(50, 'Mood name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Mood contains invalid characters')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().max(200).optional()
  }).optional().nullable()
});

const handler = async (req, res) => {
  try {
    // Authentication check
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Valid authentication required' });
    }

    // Rate limiting per user
    if (!checkRateLimit(`moods:${user.id}`, 100, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again in 15 minutes.' 
      });
    }

    const { method, query } = req;
    const maxRetries = 3;

    if (method === 'GET') {
      // Get moods for user with pagination
      const page = parseInt(query.page) || 1;
      const limit = Math.min(parseInt(query.limit) || 50, 100); // Max 100 per request
      const sortBy = query.sortBy || 'timestamp';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

      let retryCount = 0;
      let userMoods = [];

      while (retryCount < maxRetries) {
        try {
          userMoods = await storage.get(`moods:${user.id}`) || [];
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to retrieve moods after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      // Sort moods
      userMoods.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (sortBy === 'timestamp') {
          return sortOrder * (new Date(aVal) - new Date(bVal));
        }
        return sortOrder * (aVal > bVal ? 1 : -1);
      });

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMoods = userMoods.slice(startIndex, endIndex);

      // Add metadata
      const totalMoods = userMoods.length;
      const totalPages = Math.ceil(totalMoods / limit);

      console.log(`📊 Retrieved ${paginatedMoods.length} moods for user ${user.id} (page ${page}/${totalPages})`);

      return res.status(200).json({ 
        success: true,
        moods: paginatedMoods,
        pagination: {
          page,
          limit,
          totalMoods,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    }

    if (method === 'POST') {
      // Add new mood
      if (!req.body) {
        return res.status(400).json({ error: 'Request body is required' });
      }

      const validation = moodSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      const { mood, notes, location, timestamp } = validation.data;

      const newMood = {
        id: crypto.randomUUID(),
        mood,
        notes: notes || '',
        location: location || null,
        timestamp: timestamp || new Date().toISOString(),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get current moods and add new one
      let retryCount = 0;
      let userMoods = [];

      while (retryCount < maxRetries) {
        try {
          userMoods = await storage.get(`moods:${user.id}`) || [];
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to retrieve existing moods');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      // Add new mood and sort by timestamp (newest first)
      userMoods.unshift(newMood);
      
      // Limit to 10,000 moods per user (keep newest)
      if (userMoods.length > 10000) {
        userMoods = userMoods.slice(0, 10000);
      }

      // Save with retry logic
      retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await storage.set(`moods:${user.id}`, userMoods);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to save mood after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      console.log(`✅ Mood logged successfully for user ${user.id}: ${mood}`);

      return res.status(201).json({ 
        success: true,
        mood: newMood, 
        message: 'Mood logged successfully',
        totalMoods: userMoods.length
      });
    }

    if (method === 'PUT') {
      // Update existing mood
      const moodId = query.id;
      if (!moodId) {
        return res.status(400).json({ error: 'Mood ID is required' });
      }

      if (!req.body) {
        return res.status(400).json({ error: 'Request body is required' });
      }

      const validation = updateMoodSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      // Get current moods
      let retryCount = 0;
      let userMoods = [];

      while (retryCount < maxRetries) {
        try {
          userMoods = await storage.get(`moods:${user.id}`) || [];
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to retrieve moods for update');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      // Find and update mood
      const moodIndex = userMoods.findIndex(mood => mood.id === moodId);
      if (moodIndex === -1) {
        return res.status(404).json({ error: 'Mood not found' });
      }

      const updatedMood = {
        ...userMoods[moodIndex],
        ...validation.data,
        updatedAt: new Date().toISOString()
      };

      userMoods[moodIndex] = updatedMood;

      // Save with retry logic
      retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await storage.set(`moods:${user.id}`, userMoods);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to update mood after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      console.log(`📝 Mood updated successfully for user ${user.id}: ${moodId}`);

      return res.status(200).json({ 
        success: true,
        mood: updatedMood, 
        message: 'Mood updated successfully'
      });
    }

    if (method === 'DELETE') {
      // Delete mood
      const moodId = query.id;
      if (!moodId) {
        return res.status(400).json({ error: 'Mood ID is required' });
      }

      // Get current moods
      let retryCount = 0;
      let userMoods = [];

      while (retryCount < maxRetries) {
        try {
          userMoods = await storage.get(`moods:${user.id}`) || [];
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to retrieve moods for deletion');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      // Find mood to delete
      const moodIndex = userMoods.findIndex(mood => mood.id === moodId);
      if (moodIndex === -1) {
        return res.status(404).json({ error: 'Mood not found' });
      }

      // Remove mood
      const deletedMood = userMoods.splice(moodIndex, 1)[0];

      // Save with retry logic
      retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await storage.set(`moods:${user.id}`, userMoods);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to delete mood after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      console.log(`🗑️ Mood deleted successfully for user ${user.id}: ${moodId}`);

      return res.status(200).json({ 
        success: true,
        message: 'Mood deleted successfully',
        deletedMood,
        totalMoods: userMoods.length
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Moods API error:', error);
    
    // Return appropriate error response
    if (error.message.includes('Failed to retrieve moods')) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable. Please try again.' 
      });
    }
    
    if (error.message.includes('Failed to save mood') || error.message.includes('Failed to update mood') || error.message.includes('Failed to delete mood')) {
      return res.status(503).json({ 
        error: 'Failed to save changes. Please try again.' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);