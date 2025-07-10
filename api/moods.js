import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { storage } from './storage/index.js';

export const runtime = 'edge';

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

async function getUserFromRequest(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Return anonymous user ID from query params or default
    const url = new URL(req.url);
    return { 
      id: url.searchParams.get('userId') || 'anonymous',
      isAuthenticated: false 
    };
  }

  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload && payload.userId) {
      return { 
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        isAuthenticated: true 
      };
    }
  } catch (error) {
    console.warn('Invalid JWT token:', error.message);
  }

  // Fallback to anonymous
  const url = new URL(req.url);
  return { 
    id: url.searchParams.get('userId') || 'anonymous',
    isAuthenticated: false 
  };
}

export default async function handler(req) {
  const { method } = req;
  const user = await getUserFromRequest(req);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    switch (method) {
      case 'GET':
        return await getMoods(user, corsHeaders);
      
      case 'POST':
        const moodData = await req.json();
        return await createMood(user, moodData, corsHeaders);
      
      case 'PUT':
        const moodId = url.searchParams.get('id');
        const updateData = await req.json();
        return await updateMood(user, moodId, updateData, corsHeaders);
      
      case 'DELETE':
        const deleteId = url.searchParams.get('id');
        return await deleteMood(user, deleteId, corsHeaders);
      
      default:
        return new NextResponse(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function getMoods(user, corsHeaders) {
  try {
    const moods = await storage.get(`moods:${user.id}`) || [];
    
    // Add user context to response for authenticated users
    const response = { 
      moods,
      user: user.isAuthenticated ? {
        id: user.id,
        username: user.username,
        email: user.email
      } : null
    };
    
    return new NextResponse(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

async function createMood(user, moodData, corsHeaders) {
  try {
    const moods = await storage.get(`moods:${user.id}`) || [];
    
    const newMood = {
      id: crypto.randomUUID(),
      ...moodData,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userType: user.isAuthenticated ? 'authenticated' : 'anonymous'
    };
    
    // Add username for authenticated users
    if (user.isAuthenticated) {
      newMood.username = user.username;
    }
    
    moods.unshift(newMood);
    
    // Different limits for authenticated vs anonymous users
    const maxMoods = user.isAuthenticated ? 10000 : 1000;
    if (moods.length > maxMoods) {
      moods.splice(maxMoods);
    }
    
    // Longer expiry for authenticated users
    const ttl = user.isAuthenticated ? (60 * 60 * 24 * 365 * 2) : (60 * 60 * 24 * 365);
    await storage.set(`moods:${user.id}`, moods, { ttl });
    
    return new NextResponse(
      JSON.stringify({ mood: newMood }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

async function updateMood(user, moodId, updateData, corsHeaders) {
  try {
    const moods = await storage.get(`moods:${user.id}`) || [];
    const moodIndex = moods.findIndex(mood => mood.id === moodId);
    
    if (moodIndex === -1) {
      return new NextResponse(
        JSON.stringify({ error: 'Mood not found' }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Verify ownership for authenticated users
    if (user.isAuthenticated && moods[moodIndex].userId !== user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized to modify this mood' }),
        { status: 403, headers: corsHeaders }
      );
    }
    
    moods[moodIndex] = { ...moods[moodIndex], ...updateData, updatedAt: new Date().toISOString() };
    
    const ttl = user.isAuthenticated ? (60 * 60 * 24 * 365 * 2) : (60 * 60 * 24 * 365);
    await storage.set(`moods:${user.id}`, moods, { ttl });
    
    return new NextResponse(
      JSON.stringify({ mood: moods[moodIndex] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

async function deleteMood(user, moodId, corsHeaders) {
  try {
    const moods = await storage.get(`moods:${user.id}`) || [];
    const moodToDelete = moods.find(mood => mood.id === moodId);
    
    if (!moodToDelete) {
      return new NextResponse(
        JSON.stringify({ error: 'Mood not found' }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Verify ownership for authenticated users
    if (user.isAuthenticated && moodToDelete.userId !== user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized to delete this mood' }),
        { status: 403, headers: corsHeaders }
      );
    }
    
    const filteredMoods = moods.filter(mood => mood.id !== moodId);
    
    const ttl = user.isAuthenticated ? (60 * 60 * 24 * 365 * 2) : (60 * 60 * 24 * 365);
    await storage.set(`moods:${user.id}`, filteredMoods, { ttl });
    
    return new NextResponse(
      JSON.stringify({ message: 'Mood deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}