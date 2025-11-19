import AsyncStorage from '@react-native-async-storage/async-storage';

class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  async getValidToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) return null;
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      return await this.refreshToken();
    }
    
    return token;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      // Refresh 5 minutes before expiry
      return payload.exp - 300 < currentTime;
    } catch {
      return true;
    }
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        await this.clearTokens();
        return null;
      }

      const response = await fetch('https://api.jholabazar.com/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data?.accessToken) {
        await AsyncStorage.setItem('authToken', data.data.accessToken);
        return data.data.accessToken;
      } else {
        await this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return null;
    }
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('No valid token available');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401, try refresh once more
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      
      if (newToken) {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      }
    }

    return response;
  }

  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
      console.log('TokenManager: Auth tokens cleared');
    } catch (error) {
      console.error('TokenManager: Error clearing tokens:', error);
    }
  }

  async clearAllTokens(): Promise<void> {
    await this.clearTokens();
  }

  async initializeAuth(): Promise<boolean> {
    try {
      const token = await this.getValidToken();
      const isValid = !!token;
      console.log('TokenManager: Auth initialization result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await this.clearTokens(); // Clear invalid tokens
      return false;
    }
  }
}

export const tokenManager = new TokenManager();