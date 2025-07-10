import type { User, LoginCredentials, RegisterCredentials, UpdateProfileData } from '../types';

// Check if we're in development or production
const API_BASE = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('moodflow-auth-token');
    const savedUser = localStorage.getItem('moodflow-auth-user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (error) {
        console.warn('Failed to parse saved user data:', error);
        this.clearAuth();
      }
    }
  }

  // Getters
  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  // Private helper methods
  private setAuth(user: User, token: string): void {
    this.user = user;
    this.token = token;
    localStorage.setItem('moodflow-auth-user', JSON.stringify(user));
    localStorage.setItem('moodflow-auth-token', token);
  }

  private clearAuth(): void {
    this.user = null;
    this.token = null;
    localStorage.removeItem('moodflow-auth-user');
    localStorage.removeItem('moodflow-auth-token');
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Registration
  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Registration failed',
        };
      }

      // Store authentication data
      this.setAuth(data.user, data.token);

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token,
        },
        message: data.message,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Login
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }

      // Store authentication data
      this.setAuth(data.user, data.token);

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token,
        },
        message: data.message,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Logout
  async logout(): Promise<ApiResponse<null>> {
    try {
      // Call logout endpoint (mainly for server-side token invalidation if implemented)
      if (this.token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      }

      // Clear local authentication data
      this.clearAuth();

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear local data
      this.clearAuth();
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  }

  // Verify token and get current user
  async verifyToken(): Promise<ApiResponse<{ user: User | null; authenticated: boolean }>> {
    if (!this.token) {
      return {
        success: true,
        data: { user: null, authenticated: false },
      };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.authenticated) {
        // Token is invalid, clear auth data
        this.clearAuth();
        return {
          success: true,
          data: { user: null, authenticated: false },
        };
      }

      // Update user data if it exists
      if (data.user) {
        this.user = { ...this.user, ...data.user };
        localStorage.setItem('moodflow-auth-user', JSON.stringify(this.user));
      }

      return {
        success: true,
        data: {
          user: this.user,
          authenticated: true,
        },
      };
    } catch (error) {
      console.error('Token verification error:', error);
      // On network error, don't clear token (might be temporary)
      return {
        success: false,
        error: 'Failed to verify authentication',
        data: { user: this.user, authenticated: !!this.token },
      };
    }
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<User>> {
    if (!this.token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuth();
        }
        return {
          success: false,
          error: data.error || 'Failed to get profile',
        };
      }

      // Update local user data
      this.user = data.user;
      localStorage.setItem('moodflow-auth-user', JSON.stringify(this.user));

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Update user profile
  async updateProfile(profileData: UpdateProfileData): Promise<ApiResponse<User>> {
    if (!this.token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuth();
        }
        return {
          success: false,
          error: data.error || 'Failed to update profile',
        };
      }

      // Update local user data
      this.user = data.user;
      localStorage.setItem('moodflow-auth-user', JSON.stringify(this.user));

      return {
        success: true,
        data: data.user,
        message: data.message,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Delete account
  async deleteAccount(password: string): Promise<ApiResponse<null>> {
    if (!this.token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/delete-account`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete account',
        };
      }

      // Clear local authentication data
      this.clearAuth();

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Migrate anonymous data to authenticated account
  async migrateAnonymousData(): Promise<ApiResponse<null>> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    try {
      // Get anonymous data from localStorage
      const anonymousMoods = localStorage.getItem('moodflow-moods');
      const anonymousSettings = localStorage.getItem('moodflow-settings');

      if (!anonymousMoods && !anonymousSettings) {
        return {
          success: true,
          message: 'No anonymous data to migrate',
        };
      }

      // Send migration request
      const response = await fetch(`${API_BASE}/auth/migrate-data`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          moods: anonymousMoods ? JSON.parse(anonymousMoods) : [],
          settings: anonymousSettings ? JSON.parse(anonymousSettings) : {},
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: data.error || 'Failed to migrate data',
        };
      }

      // Clear anonymous data after successful migration
      localStorage.removeItem('moodflow-moods');
      localStorage.removeItem('moodflow-settings');

      return {
        success: true,
        message: 'Data migrated successfully',
      };
    } catch (error) {
      console.error('Data migration error:', error);
      return {
        success: false,
        error: 'Failed to migrate data',
      };
    }
  }

  // Check if user has anonymous data to migrate
  hasAnonymousDataToMigrate(): boolean {
    const anonymousMoods = localStorage.getItem('moodflow-moods');
    
    if (anonymousMoods) {
      try {
        const moods = JSON.parse(anonymousMoods);
        if (Array.isArray(moods) && moods.length > 0) {
          return true;
        }
      } catch (error) {
        console.warn('Failed to parse anonymous moods:', error);
      }
    }

    return false;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;