import { storage } from '../storage/index.js';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { z } from 'zod';
import validator from 'validator';

export const runtime = 'edge';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
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
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, password } = validation.data;
    const sanitizedEmail = validator.normalizeEmail(email);

    const userId = await storage.get(`user:email:${sanitizedEmail}`);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await storage.get(`user:${userId}`);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await storage.set(`user:${userId}`, user);

    // Generate JWT
    const token = await new SignJWT({ 
      userId: user.id, 
      username: user.username, 
      email: user.email 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const { password: _, ...userResponse } = user;
    
    return new Response(
      JSON.stringify({ 
        user: userResponse, 
        token,
        message: 'Login successful'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}