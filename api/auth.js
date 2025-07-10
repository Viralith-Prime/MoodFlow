import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import validator from 'validator';
import { getStorageEngine } from './storage/CustomStorageEngine.js';

export const runtime = 'edge';

// Get custom storage instance
const storage = getStorageEngine();

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);
const JWT_EXPIRY = '7d';

// Validation Schemas
const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(128).optional()
});

// Utility Functions
async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

async function generateJWT(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

async function getUserFromToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token);
  
  if (!payload || !payload.userId) {
    return null;
  }

  const user = await storage.get(`user:${payload.userId}`);
  return user;
}

// Rate limiting
const rateLimitMap = new Map();

function checkRateLimit(ip, endpoint) {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  let requests = rateLimitMap.get(key) || [];
  requests = requests.filter(time => now - time < windowMs);
  
  const limits = {
    register: 3,
    login: 10,
    'forgot-password': 3
  };
  
  if (requests.length >= (limits[endpoint] || 100)) {
    return false;
  }
  
  requests.push(now);
  rateLimitMap.set(key, requests);
  return true;
}

export default async function handler(req) {
  const { method } = req;
  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientIP, endpoint)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    switch (endpoint) {
      case 'register':
        return await handleRegister(req, corsHeaders);
      case 'login':
        return await handleLogin(req, corsHeaders);
      case 'logout':
        return await handleLogout(req, corsHeaders);
      case 'profile':
        return await handleProfile(req, corsHeaders);
      case 'verify':
        return await handleVerify(req, corsHeaders);
      case 'delete-account':
        return await handleDeleteAccount(req, corsHeaders);
      case 'migrate-data':
        return await handleMigrateData(req, corsHeaders);
      default:
        return new NextResponse(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { status: 404, headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleRegister(req, corsHeaders) {
  if (req.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  const body = await req.json();
  const validation = registerSchema.safeParse(body);
  
  if (!validation.success) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Validation failed', 
        details: validation.error.errors.map(e => e.message)
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { username, email, password } = validation.data;

  // Sanitize email
  const sanitizedEmail = validator.normalizeEmail(email);
  if (!sanitizedEmail) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid email format' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Check if user already exists
  const existingUser = await storage.get(`user:email:${sanitizedEmail}`);
  if (existingUser) {
    return new NextResponse(
      JSON.stringify({ error: 'User already exists with this email' }),
      { status: 409, headers: corsHeaders }
    );
  }

  // Check if username is taken
  const existingUsername = await storage.get(`user:username:${username.toLowerCase()}`);
  if (existingUsername) {
    return new NextResponse(
      JSON.stringify({ error: 'Username is already taken' }),
      { status: 409, headers: corsHeaders }
    );
  }

  // Create user
  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  const user = {
    id: userId,
    username,
    email: sanitizedEmail,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
    isVerified: true, // For simplicity, auto-verify
    lastLogin: now
  };

  // Store user data with 2 year TTL
  const ttl = 60 * 60 * 24 * 365 * 2; // 2 years in seconds
  await storage.set(`user:${userId}`, user, { ttl });
  await storage.set(`user:email:${sanitizedEmail}`, userId, { ttl });
  await storage.set(`user:username:${username.toLowerCase()}`, userId, { ttl });

  // Generate JWT
  const token = await generateJWT({ userId, username, email: sanitizedEmail });

  // Return user data (without password)
  const { password: _, ...userResponse } = user;
  
  return new NextResponse(
    JSON.stringify({ 
      user: userResponse, 
      token,
      message: 'Account created successfully'
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleLogin(req, corsHeaders) {
  if (req.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  const body = await req.json();
  const validation = loginSchema.safeParse(body);
  
  if (!validation.success) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { email, password } = validation.data;
  const sanitizedEmail = validator.normalizeEmail(email);

  // Get user
  const userId = await storage.get(`user:email:${sanitizedEmail}`);
  if (!userId) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const user = await storage.get(`user:${userId}`);
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  await storage.set(`user:${userId}`, user, { ttl: 60 * 60 * 24 * 365 * 2 });

  // Generate JWT
  const token = await generateJWT({ 
    userId: user.id, 
    username: user.username, 
    email: user.email 
  });

  // Return user data (without password)
  const { password: _, ...userResponse } = user;
  
  return new NextResponse(
    JSON.stringify({ 
      user: userResponse, 
      token,
      message: 'Login successful'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleLogout(req, corsHeaders) {
  if (req.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  // For JWT, logout is handled client-side by removing the token
  return new NextResponse(
    JSON.stringify({ message: 'Logout successful' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleProfile(req, corsHeaders) {
  const user = await getUserFromToken(req);
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  if (req.method === 'GET') {
    const { password: _, ...userResponse } = user;
    return new NextResponse(
      JSON.stringify({ user: userResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method === 'PUT') {
    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.errors.map(e => e.message)
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const updates = validation.data;
    
    // If changing password, verify current password
    if (updates.newPassword) {
      if (!updates.currentPassword) {
        return new NextResponse(
          JSON.stringify({ error: 'Current password required to change password' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const isValidPassword = await verifyPassword(updates.currentPassword, user.password);
      if (!isValidPassword) {
        return new NextResponse(
          JSON.stringify({ error: 'Current password is incorrect' }),
          { status: 400, headers: corsHeaders }
        );
      }

      user.password = await hashPassword(updates.newPassword);
    }

    // Update other fields
    if (updates.username && updates.username !== user.username) {
      // Check if username is available
      const existingUsername = await storage.get(`user:username:${updates.username.toLowerCase()}`);
      if (existingUsername && existingUsername !== user.id) {
        return new NextResponse(
          JSON.stringify({ error: 'Username is already taken' }),
          { status: 409, headers: corsHeaders }
        );
      }

      // Remove old username mapping
      await storage.del(`user:username:${user.username.toLowerCase()}`);
      // Add new username mapping
      await storage.set(`user:username:${updates.username.toLowerCase()}`, user.id, { ttl: 60 * 60 * 24 * 365 * 2 });
      
      user.username = updates.username;
    }

    if (updates.email && updates.email !== user.email) {
      const sanitizedEmail = validator.normalizeEmail(updates.email);
      if (!sanitizedEmail) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Check if email is available
      const existingEmail = await storage.get(`user:email:${sanitizedEmail}`);
      if (existingEmail && existingEmail !== user.id) {
        return new NextResponse(
          JSON.stringify({ error: 'Email is already taken' }),
          { status: 409, headers: corsHeaders }
        );
      }

      // Remove old email mapping
      await storage.del(`user:email:${user.email}`);
      // Add new email mapping
      await storage.set(`user:email:${sanitizedEmail}`, user.id, { ttl: 60 * 60 * 24 * 365 * 2 });
      
      user.email = sanitizedEmail;
    }

    user.updatedAt = new Date().toISOString();

    // Save updated user
    await storage.set(`user:${user.id}`, user, { ttl: 60 * 60 * 24 * 365 * 2 });

    // Return user data (without password)
    const { password: _, ...userResponse } = user;
    
    return new NextResponse(
      JSON.stringify({ 
        user: userResponse,
        message: 'Profile updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new NextResponse(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}

async function handleVerify(req, corsHeaders) {
  if (req.method !== 'GET') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  const user = await getUserFromToken(req);
  
  return new NextResponse(
    JSON.stringify({ 
      authenticated: !!user,
      user: user ? { id: user.id, username: user.username, email: user.email } : null
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDeleteAccount(req, corsHeaders) {
  if (req.method !== 'DELETE') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const body = await req.json();
  const { password } = body;

  if (!password) {
    return new NextResponse(
      JSON.stringify({ error: 'Password required to delete account' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid password' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Delete all user data
  await storage.del(`user:${user.id}`);
  await storage.del(`user:email:${user.email}`);
  await storage.del(`user:username:${user.username.toLowerCase()}`);
  await storage.del(`moods:${user.id}`);
  await storage.del(`settings:${user.id}`);

  return new NextResponse(
    JSON.stringify({ message: 'Account deleted successfully' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleMigrateData(req, corsHeaders) {
  if (req.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const body = await req.json();
  const { moods, settings } = body;

  try {
    // Store migrated data
    if (moods && Array.isArray(moods)) {
      await storage.set(`moods:${user.id}`, moods, { ttl: 60 * 60 * 24 * 365 * 2 });
    }

    if (settings && typeof settings === 'object') {
      await storage.set(`settings:${user.id}`, settings, { ttl: 60 * 60 * 24 * 365 * 2 });
    }

    return new NextResponse(
      JSON.stringify({ 
        message: 'Data migrated successfully',
        migratedMoods: moods?.length || 0,
        migratedSettings: settings ? Object.keys(settings).length : 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to migrate data' }),
      { status: 500, headers: corsHeaders }
    );
  }
}