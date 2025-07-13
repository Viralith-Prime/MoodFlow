import { storageAdapter } from '../storage/StorageAdapter.js';
import { authEngine } from './CustomAuthEngine.js';

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

const handler = async (req, res) => {
  // Method validation
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        authenticated: false,
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using auth engine
    const verificationResult = await authEngine.verifyToken(token, storageAdapter);

    if (!verificationResult.valid) {
      return res.status(401).json({ 
        authenticated: false,
        error: verificationResult.reason 
      });
    }

    // Get user data
    const user = await storageAdapter.get(`user:${verificationResult.userId}`);
    
    if (!user) {
      return res.status(401).json({ 
        authenticated: false,
        error: 'User not found' 
      });
    }

    console.log(`✅ Token verified for user: ${user.email}`);

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      authenticated: false,
      error: 'Internal server error' 
    });
  }
};

export default withErrorHandling(handler);