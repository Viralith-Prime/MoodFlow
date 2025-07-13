import { authService } from './authService';

// Simple API service for anonymous users
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
  }

  // Simple user ID generation
  private getUserId(): string {
    return authService.getUserId();
  }

  // Get moods for the current user
  async getMoods(page = 1, limit = 50): Promise<any> {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.baseUrl}/moods?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch moods:', error);
      return { success: false, error: 'Failed to fetch moods' };
    }
  }

  // Add a new mood
  async addMood(moodData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/moods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moodData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to add mood:', error);
      return { success: false, error: 'Failed to add mood' };
    }
  }

  // Update a mood
  async updateMood(moodId: string, moodData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/moods?id=${moodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moodData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update mood:', error);
      return { success: false, error: 'Failed to update mood' };
    }
  }

  // Delete a mood
  async deleteMood(moodId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/moods?id=${moodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete mood:', error);
      return { success: false, error: 'Failed to delete mood' };
    }
  }

  // Get user settings
  async getSettings(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      return { success: false, error: 'Failed to fetch settings' };
    }
  }

  // Update user settings
  async updateSettings(settings: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: 'Health check failed' };
    }
  }

  // Get storage stats
  async getStorageStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { success: false, error: 'Failed to get storage stats' };
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;