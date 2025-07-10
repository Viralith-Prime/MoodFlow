import { NextResponse } from 'next/server';
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  try {
    switch (method) {
      case 'GET':
        return await getSettings(user, corsHeaders);
      
      case 'PUT':
        const settingsData = await req.json();
        return await updateSettings(user, settingsData, corsHeaders);
      
      default:
        return new NextResponse(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error('Settings API Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function getSettings(user, corsHeaders) {
  try {
    const settings = await storage.get(`settings:${user.id}`) || {};
    
    // Add account info for authenticated users
    if (user.isAuthenticated) {
      settings.account = {
        username: user.username,
        email: user.email
      };
    }
    
    const response = {
      settings,
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

async function updateSettings(user, settingsData, corsHeaders) {
  try {
    const existingSettings = await storage.get(`settings:${user.id}`) || {};
    
    // Don't allow account updates through settings API (use auth API instead)
    const { account, ...safeSettingsData } = settingsData;
    
    const updatedSettings = { 
      ...existingSettings, 
      ...safeSettingsData,
      updatedAt: new Date().toISOString()
    };
    
    // Add account info for authenticated users
    if (user.isAuthenticated) {
      updatedSettings.account = {
        username: user.username,
        email: user.email
      };
    }
    
    // Longer expiry for authenticated users
    const ttl = user.isAuthenticated ? (60 * 60 * 24 * 365 * 2) : (60 * 60 * 24 * 365);
    await storage.set(`settings:${user.id}`, updatedSettings, { ttl });
    
    return new NextResponse(
      JSON.stringify({ 
        settings: updatedSettings,
        message: 'Settings updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}