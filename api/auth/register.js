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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'moodflow-super-secure-jwt-key-production-2024'
);

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
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
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

    // Check for existing users with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let existingUser, existingUsername;

    while (retryCount < maxRetries) {
      try {
        [existingUser, existingUsername] = await Promise.all([
          storage.get(`user:email:${sanitizedEmail}`),
          storage.get(`user:username:${username.toLowerCase()}`)
        ]);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error('Failed to check existing users after multiple attempts');
        }
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }

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

    // Create user with enhanced security
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

    // Store user data with retry logic
    retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        await Promise.all([
          storage.set(`user:${userId}`, user),
          storage.set(`user:email:${sanitizedEmail}`, userId),
          storage.set(`user:username:${username.toLowerCase()}`, userId)
        ]);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error('Failed to create user after multiple attempts');
        }
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }

    // Generate JWT with enhanced payload
    const tokenPayload = {
      userId,
      username,
      email: sanitizedEmail,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Prepare response (exclude sensitive data)
    const { password: _, ...userResponse } = user;
    
    // Log successful registration
    console.log(`✅ User registered successfully: ${sanitizedEmail} (${userId})`);
    
    return res.status(201).json({ 
      success: true,
      user: userResponse, 
      token,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Return appropriate error response
    if (error.message.includes('Failed to check existing users')) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable. Please try again.' 
      });
    }
    
    if (error.message.includes('Failed to create user')) {
      return res.status(503).json({ 
        error: 'Failed to create account. Please try again.' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);