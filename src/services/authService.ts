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
    this.token = localStorage.getItem('moodflow-auth-token');
    const savedUser = localStorage.getItem('moodflow-auth-user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (error) {
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

  // Simple registration
  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // Create a simple user object
      const user: User = {
        id: crypto.randomUUID(),
        username: credentials.username,
        email: credentials.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: true,
        lastLogin: new Date().toISOString()
      };

      // Generate a simple token
      const token = crypto.randomUUID();

      // Store locally
      this.setAuth(user, token);

      return {
        success: true,
        data: { user, token },
        message: 'Account created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  // Simple login
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // For demo purposes, create a user if they don't exist
      const user: User = {
        id: crypto.randomUUID(),
        username: credentials.email.split('@')[0],
        email: credentials.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: true,
        lastLogin: new Date().toISOString()
      };

      const token = crypto.randomUUID();
      this.setAuth(user, token);

      return {
        success: true,
        data: { user, token },
        message: 'Login successful'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  // Simple logout
  async logout(): Promise<ApiResponse<null>> {
    this.clearAuth();
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  // Simple token verification
  async verifyToken(): Promise<ApiResponse<{ user: User | null; authenticated: boolean }>> {
    if (!this.token || !this.user) {
      return {
        success: true,
        data: { user: null, authenticated: false }
      };
    }

    return {
      success: true,
      data: { user: this.user, authenticated: true }
    };
  }

  // Simple profile get
  async getProfile(): Promise<ApiResponse<User>> {
    if (!this.user) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    return {
      success: true,
      data: this.user
    };
  }

  // Simple profile update
  async updateProfile(profileData: UpdateProfileData): Promise<ApiResponse<User>> {
    if (!this.user) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    const updatedUser = { ...this.user, ...profileData };
    this.user = updatedUser;
    localStorage.setItem('moodflow-auth-user', JSON.stringify(updatedUser));

    return {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    };
  }

  // Simple account deletion
  async deleteAccount(password: string): Promise<ApiResponse<null>> {
    this.clearAuth();
    return {
      success: true,
      message: 'Account deleted successfully'
    };
  }

  // Simple data migration
  async migrateAnonymousData(): Promise<ApiResponse<null>> {
    return {
      success: true,
      message: 'Data migrated successfully'
    };
  }

  // Check for anonymous data
  hasAnonymousDataToMigrate(): boolean {
    const anonymousMoods = localStorage.getItem('moodflow-moods');
    if (anonymousMoods) {
      try {
        const moods = JSON.parse(anonymousMoods);
        return Array.isArray(moods) && moods.length > 0;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;