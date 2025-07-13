import type { User } from '../types';

/**
 * Simple Authentication Service - No JWT, Anonymous Users
 * Provides basic user management without complex authentication
 */

class AuthService {
  private user: User | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    
    // Generate anonymous user ID based on browser fingerprint
    const anonymousId = this.generateAnonymousId();
    
    this.user = {
      id: anonymousId,
      email: '',
      username: 'Anonymous User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: false,
      lastLogin: new Date().toISOString()
    };
    
    this.isInitialized = true;
    console.log('🔐 Simple auth service initialized');
  }

  private generateAnonymousId(): string {
    // Create a simple anonymous ID based on browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Anonymous', 0, 0);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `anon_${Math.abs(hash).toString(36)}`;
  }

  // Get current user
  getUser(): User | null {
    this.init();
    return this.user;
  }

  // Check if user is authenticated (always true for anonymous users)
  isAuthenticated(): boolean {
    this.init();
    return this.user !== null;
  }

  // Get user ID
  getUserId(): string {
    this.init();
    return this.user?.id || 'anonymous';
  }

  // Get token (returns null for anonymous users)
  getToken(): string | null {
    return null; // No tokens for anonymous users
  }

  // Login (no-op for anonymous users)
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    console.log('⚠️ Login not available in anonymous mode');
    return {
      success: false,
      error: 'Login not available in anonymous mode'
    };
  }

  // Register (no-op for anonymous users)
  async register(email: string, username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    console.log('⚠️ Registration not available in anonymous mode');
    return {
      success: false,
      error: 'Registration not available in anonymous mode'
    };
  }

  // Logout (no-op for anonymous users)
  async logout(): Promise<{ success: boolean }> {
    console.log('⚠️ Logout not available in anonymous mode');
    return { success: true };
  }

  // Verify token (always returns false for anonymous users)
  async verifyToken(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
    return {
      success: false,
      error: 'Token verification not available in anonymous mode'
    };
  }

  // Update user profile (limited for anonymous users)
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!this.user) {
      return {
        success: false,
        error: 'No user found'
      };
    }

    // Only allow updating username for anonymous users
    if (updates.username && typeof updates.username === 'string') {
      this.user.username = updates.username;
      this.user.updatedAt = new Date().toISOString();
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('moodflow_anonymous_user', JSON.stringify(this.user));
      } catch (error) {
        console.warn('Failed to save user to localStorage:', error);
      }
      
      return {
        success: true,
        user: this.user
      };
    }

    return {
      success: false,
      error: 'Only username can be updated for anonymous users'
    };
  }

  // Get user settings (returns default settings)
  async getUserSettings(): Promise<any> {
    return {
      theme: 'light',
      notifications: true,
      privacy: 'private',
      language: 'en',
      timezone: 'UTC',
      moodReminders: true,
      reminderFrequency: 'daily',
      dataExport: false,
      shareLocation: false,
      analyticsEnabled: true
    };
  }

  // Update user settings
  async updateUserSettings(settings: any): Promise<{ success: boolean; settings?: any; error?: string }> {
    // For anonymous users, we'll just return success
    // Settings will be handled by the settings API
    return {
      success: true,
      settings
    };
  }

  // Check if user can perform actions (always true for anonymous users)
  canPerformAction(action: string): boolean {
    return true; // Anonymous users can perform all basic actions
  }

  // Get user permissions (basic permissions for anonymous users)
  getUserPermissions(): string[] {
    return [
      'read_moods',
      'write_moods',
      'read_settings',
      'write_settings'
    ];
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; details?: any }> {
    return {
      healthy: this.isInitialized && this.user !== null,
      details: {
        isInitialized: this.isInitialized,
        hasUser: this.user !== null,
        userId: this.user?.id,
        mode: 'anonymous'
      }
    };
  }

  // Clear all data (for testing)
  clearData(): void {
    this.user = null;
    this.isInitialized = false;
    
    try {
      localStorage.removeItem('moodflow_anonymous_user');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // Load user from localStorage (for persistence)
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('moodflow_anonymous_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          this.user = parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load user from localStorage:', error);
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;