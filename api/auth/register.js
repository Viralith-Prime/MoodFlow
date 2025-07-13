import { storageAdapter } from '../storage/StorageAdapter.js';
import { authEngine } from './CustomAuthEngine.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import validator from 'validator';

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
const checkRateLimit = (identifier, limit = 5, window = 15 * 60 * 1000) => {
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

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
});

const handler = async (req, res) => {
  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(`register:${clientIP}`, 3, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Too many registration attempts. Please try again in 15 minutes.' 
      });
    }

    // Request validation
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const validation = registerSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const { username, email, password } = validation.data;

    // Email sanitization and validation
    const sanitizedEmail = validator.normalizeEmail(email);
    if (!sanitizedEmail) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Additional email validation
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for existing users
    const existingUser = await storageAdapter.get(`user:email:${sanitizedEmail}`);
    const existingUsername = await storageAdapter.get(`user:username:${username.toLowerCase()}`);

    if (existingUser) {
      return res.status(409).json({ 
        error: 'An account with this email already exists' 
      });
    }

    if (existingUsername) {
      return res.status(409).json({ 
        error: 'This username is already taken' 
      });
    }

    // Create user
    const userId = crypto.randomUUID();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const now = new Date().toISOString();

    const user = {
      id: userId,
      username,
      email: sanitizedEmail,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      isVerified: true,
      lastLogin: now,
      loginAttempts: 0,
      accountLocked: false,
      preferences: {
        theme: 'light',
        notifications: true,
        privacy: 'private'
      }
    };

    // Store user data
    await Promise.all([
      storageAdapter.set(`user:${userId}`, user),
      storageAdapter.set(`user:email:${sanitizedEmail}`, userId),
      storageAdapter.set(`user:username:${username.toLowerCase()}`, userId)
    ]);

    // Get device info for authentication
    const deviceInfo = {
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      screenResolution: req.headers['sec-ch-viewport-width'] ? 
        `${req.headers['sec-ch-viewport-width']}x${req.headers['sec-ch-viewport-height']}` : '',
      timezone: req.headers['sec-ch-prefers-color-scheme'] || '',
      language: req.headers['accept-language'] || ''
    };

    // Create session using auth engine
    const session = await authEngine.createSession(userId, deviceInfo, storageAdapter);

    console.log(`✅ User ${username} registered successfully`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);