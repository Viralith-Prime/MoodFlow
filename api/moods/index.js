import { storage } from '../storage/index.js';
import { jwtVerify } from 'jose';

export const runtime = 'edge';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

async function getUserFromToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.userId) {
      return null;
    }
    const user = await storage.get(`user:${payload.userId}`);
    return user;
  } catch (error) {
    return null;
  }
}

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    if (req.method === 'GET') {
      // Get moods for user
      const userMoods = await storage.get(`moods:${user.id}`) || [];
      return new Response(
        JSON.stringify({ moods: userMoods }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Add new mood
      const body = await req.json();
      const { mood, notes, location, timestamp } = body;

      if (!mood) {
        return new Response(
          JSON.stringify({ error: 'Mood is required' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const newMood = {
        id: crypto.randomUUID(),
        mood,
        notes: notes || '',
        location: location || null,
        timestamp: timestamp || new Date().toISOString(),
        userId: user.id
      };

      const userMoods = await storage.get(`moods:${user.id}`) || [];
      userMoods.push(newMood);
      await storage.set(`moods:${user.id}`, userMoods);

      return new Response(
        JSON.stringify({ mood: newMood, message: 'Mood logged successfully' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      // Delete mood
      const url = new URL(req.url);
      const moodId = url.searchParams.get('id');

      if (!moodId) {
        return new Response(
          JSON.stringify({ error: 'Mood ID is required' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const userMoods = await storage.get(`moods:${user.id}`) || [];
      const filteredMoods = userMoods.filter(mood => mood.id !== moodId);
      await storage.set(`moods:${user.id}`, filteredMoods);

      return new Response(
        JSON.stringify({ message: 'Mood deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Moods API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}