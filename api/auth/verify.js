import { storage } from '../storage/index.js';
import { jwtVerify } from 'jose';

const withErrorHandling = (handler) => async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'moodflow-super-secure-jwt-key-production-2024'
);

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ 
        authenticated: false, 
        user: null 
      });
    }

    const token = authHeader.slice(7);
    
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (!payload || !payload.userId) {
        return res.status(200).json({ 
          authenticated: false, 
          user: null 
        });
      }

      const user = await storage.get(`user:${payload.userId}`);
      
      if (!user) {
        return res.status(200).json({ 
          authenticated: false, 
          user: null 
        });
      }

      const { password: _, ...userResponse } = user;
      
      return res.status(200).json({ 
        authenticated: true, 
        user: userResponse 
      });
    } catch (jwtError) {
      return res.status(200).json({ 
        authenticated: false, 
        user: null 
      });
    }
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);