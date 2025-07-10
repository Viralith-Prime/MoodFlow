import { storage } from '../storage/index.js';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'moodflow-super-secure-jwt-key-production-2024'
);

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
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(`login:${clientIP}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Too many login attempts. Please try again in 15 minutes.' 
      });
    }

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

    // Get user with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let userId, user;

    while (retryCount < maxRetries) {
      try {
        userId = await storage.get(`user:email:${sanitizedEmail}`);
        if (userId) {
          user = await storage.get(`user:${userId}`);
        }
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error('Failed to retrieve user after multiple attempts');
        }
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }

    if (!userId || !user) {
      // Simulate processing time to prevent timing attacks
      await bcrypt.hash('dummy-password', 12);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockoutExpiry && new Date() < new Date(user.lockoutExpiry)) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      const failedAttempts = (user.loginAttempts || 0) + 1;
      const maxFailedAttempts = 5;
      
      let updates = {
        ...user,
        loginAttempts: failedAttempts,
        lastFailedLogin: new Date().toISOString()
      };

      // Lock account if too many failed attempts
      if (failedAttempts >= maxFailedAttempts) {
        updates.accountLocked = true;
        updates.lockoutExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
      }

      // Save failed attempt
      try {
        await storage.set(`user:${userId}`, updates);
      } catch (error) {
        console.error('Failed to update login attempts:', error);
      }

      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Successful login - reset failed attempts and unlock account
    const loginTime = new Date().toISOString();
    const updatedUser = {
      ...user,
      lastLogin: loginTime,
      loginAttempts: 0,
      accountLocked: false,
      lockoutExpiry: null,
      updatedAt: loginTime
    };

    // Update user with retry logic
    retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        await storage.set(`user:${userId}`, updatedUser);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Failed to update user login info:', error);
          // Continue with login even if update fails
        } else {
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }
    }

    // Generate JWT with enhanced payload
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      loginTime
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Prepare response (exclude sensitive data)
    const { password: _, loginAttempts, accountLocked, lockoutExpiry, ...userResponse } = updatedUser;
    
    // Log successful login
    console.log(`✅ User logged in successfully: ${sanitizedEmail} (${userId})`);
    
    return res.status(200).json({ 
      success: true,
      user: userResponse, 
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Return appropriate error response
    if (error.message.includes('Failed to retrieve user')) {
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