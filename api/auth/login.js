import { storageAdapter } from '../storage/StorageAdapter.js';
import { authEngine } from './CustomAuthEngine.js';
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

// Rate limiting with account lockout protection
const rateLimitStore = new Map();
const checkRateLimit = (identifier, limit = 10, window = 15 * 60 * 1000) => {
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

// Custom auth engine handles all authentication logic

const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email is too long'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long')
});

const handler = async (req, res) => {
  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Request validation
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid email or password',
        details: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const { email, password } = validation.data;
    const sanitizedEmail = validator.normalizeEmail(email);

    if (!sanitizedEmail) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Additional email validation
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get device info for authentication
    const deviceInfo = {
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      screenResolution: req.headers['sec-ch-viewport-width'] ? 
        `${req.headers['sec-ch-viewport-width']}x${req.headers['sec-ch-viewport-height']}` : '',
      timezone: req.headers['sec-ch-prefers-color-scheme'] || '',
      language: req.headers['accept-language'] || ''
    };

    // Use custom auth engine for authentication
    const authResult = await authEngine.authenticateUser(
      sanitizedEmail, 
      password, 
      deviceInfo, 
      storageAdapter
    );

    if (!authResult.success) {
      return res.status(401).json({ 
        error: authResult.error,
        blocked: authResult.blocked,
        remainingTime: authResult.remainingTime
      });
    }

    console.log(`🔐 User ${authResult.user.email} logged in successfully`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: authResult.session.token,
      expiresAt: authResult.session.expiresAt,
      user: {
        id: authResult.user.id,
        username: authResult.user.username,
        email: authResult.user.email,
        createdAt: authResult.user.createdAt,
        preferences: authResult.user.preferences
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);