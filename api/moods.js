import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export default async function handler(req) {
  const { method } = req;
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId') || 'anonymous';

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
    switch (method) {
      case 'GET':
        return await getMoods(userId, corsHeaders);
      
      case 'POST':
        const moodData = await req.json();
        return await createMood(userId, moodData, corsHeaders);
      
      case 'PUT':
        const moodId = url.searchParams.get('id');
        const updateData = await req.json();
        return await updateMood(userId, moodId, updateData, corsHeaders);
      
      case 'DELETE':
        const deleteId = url.searchParams.get('id');
        return await deleteMood(userId, deleteId, corsHeaders);
      
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

async function getMoods(userId, corsHeaders) {
  try {
    const moods = await kv.get(`moods:${userId}`) || [];
    return new NextResponse(
      JSON.stringify({ moods }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

async function createMood(userId, moodData, corsHeaders) {
  try {
    const moods = await kv.get(`moods:${userId}`) || [];
    
    const newMood = {
      id: crypto.randomUUID(),
      ...moodData,
      timestamp: new Date().toISOString(),
      userId
    };
    
    moods.unshift(newMood);
    
    // Keep only last 1000 moods per user (free tier limits)
    if (moods.length > 1000) {
      moods.splice(1000);
    }
    
    await kv.set(`moods:${userId}`, moods, { ex: 60 * 60 * 24 * 365 }); // 1 year expiry
    
    return new NextResponse(
      JSON.stringify({ mood: newMood }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

async function updateMood(userId, moodId, updateData, corsHeaders) {
  try {
    const moods = await kv.get(`moods:${userId}`) || [];
    const moodIndex = moods.findIndex(mood => mood.id === moodId);
    
    if (moodIndex === -1) {
      return new NextResponse(
        JSON.stringify({ error: 'Mood not found' }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    moods[moodIndex] = { ...moods[moodIndex], ...updateData };
    await kv.set(`moods:${userId}`, moods, { ex: 60 * 60 * 24 * 365 });
    
    return new NextResponse(
      JSON.stringify({ mood: moods[moodIndex] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

async function deleteMood(userId, moodId, corsHeaders) {
  try {
    const moods = await kv.get(`moods:${userId}`) || [];
    const filteredMoods = moods.filter(mood => mood.id !== moodId);
    
    if (filteredMoods.length === moods.length) {
      return new NextResponse(
        JSON.stringify({ error: 'Mood not found' }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    await kv.set(`moods:${userId}`, filteredMoods, { ex: 60 * 60 * 24 * 365 });
    
    return new NextResponse(
      JSON.stringify({ message: 'Mood deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}