import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export default async function handler(req) {
  const { method } = req;
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId') || 'anonymous';

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
        return await getSettings(userId, corsHeaders);
      
      case 'PUT':
        const settingsData = await req.json();
        return await updateSettings(userId, settingsData, corsHeaders);
      
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

async function getSettings(userId, corsHeaders) {
  try {
    const settings = await kv.get(`settings:${userId}`) || {};
    return new NextResponse(
      JSON.stringify({ settings }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

async function updateSettings(userId, settingsData, corsHeaders) {
  try {
    const existingSettings = await kv.get(`settings:${userId}`) || {};
    const updatedSettings = { ...existingSettings, ...settingsData };
    
    await kv.set(`settings:${userId}`, updatedSettings, { ex: 60 * 60 * 24 * 365 }); // 1 year expiry
    
    return new NextResponse(
      JSON.stringify({ settings: updatedSettings }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}