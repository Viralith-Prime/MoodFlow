import { storage } from '../storage/index.js';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { z } from 'zod';
import validator from 'validator';

export const runtime = 'edge';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.errors.map(e => e.message)
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { username, email, password } = validation.data;
    const sanitizedEmail = validator.normalizeEmail(email);

    if (!sanitizedEmail) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user exists
    const existingUser = await storage.get(`user:email:${sanitizedEmail}`);
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User already exists with this email' }),
        { status: 409, headers: corsHeaders }
      );
    }

    const existingUsername = await storage.get(`user:username:${username.toLowerCase()}`);
    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: 'Username is already taken' }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Create user
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    const user = {
      id: userId,
      username,
      email: sanitizedEmail,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      isVerified: true,
      lastLogin: now
    };

    await storage.set(`user:${userId}`, user);
    await storage.set(`user:email:${sanitizedEmail}`, userId);
    await storage.set(`user:username:${username.toLowerCase()}`, userId);

    // Generate JWT
    const token = await new SignJWT({ userId, username, email: sanitizedEmail })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const { password: _, ...userResponse } = user;
    
    return new Response(
      JSON.stringify({ 
        user: userResponse, 
        token,
        message: 'Account created successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Register error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}