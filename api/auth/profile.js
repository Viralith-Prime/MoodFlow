import { storage } from '../storage/index.js';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import validator from 'validator';

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

const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email is too long')
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .optional()
});

const handler = async (req, res) => {
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const { password: _, ...userResponse } = user;
      return res.status(200).json({ 
        success: true,
        user: userResponse 
      });
    }

    if (req.method === 'PUT') {
      if (!req.body) {
        return res.status(400).json({ error: 'Request body is required' });
      }

      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      const updates = validation.data;
      
      // If changing password, verify current password
      if (updates.newPassword) {
        if (!updates.currentPassword) {
          return res.status(400).json({ 
            error: 'Current password required to change password' 
          });
        }

        const isValidPassword = await bcrypt.compare(updates.currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ 
            error: 'Current password is incorrect' 
          });
        }

        user.password = await bcrypt.hash(updates.newPassword, 12);
      }

      // Update username if provided
      if (updates.username && updates.username !== user.username) {
        const existingUsername = await storage.get(`user:username:${updates.username.toLowerCase()}`);
        if (existingUsername && existingUsername !== user.id) {
          return res.status(409).json({ 
            error: 'Username is already taken' 
          });
        }

        // Remove old username mapping
        await storage.del(`user:username:${user.username.toLowerCase()}`);
        // Add new username mapping
        await storage.set(`user:username:${updates.username.toLowerCase()}`, user.id);
        
        user.username = updates.username;
      }

      // Update email if provided
      if (updates.email && updates.email !== user.email) {
        const sanitizedEmail = validator.normalizeEmail(updates.email);
        if (!sanitizedEmail) {
          return res.status(400).json({ 
            error: 'Invalid email format' 
          });
        }

        const existingEmail = await storage.get(`user:email:${sanitizedEmail}`);
        if (existingEmail && existingEmail !== user.id) {
          return res.status(409).json({ 
            error: 'Email is already taken' 
          });
        }

        // Remove old email mapping
        await storage.del(`user:email:${user.email}`);
        // Add new email mapping
        await storage.set(`user:email:${sanitizedEmail}`, user.id);
        
        user.email = sanitizedEmail;
      }

      user.updatedAt = new Date().toISOString();

      // Save updated user
      await storage.set(`user:${user.id}`, user);

      // Return user data (without password)
      const { password: _, ...userResponse } = user;
      
      return res.status(200).json({ 
        success: true,
        user: userResponse,
        message: 'Profile updated successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);