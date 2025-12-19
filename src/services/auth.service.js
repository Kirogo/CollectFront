// src/services/auth.service.js - UPDATED
const API_URL = 'http://localhost:5000/api';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

const authService = {
  async login(username, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }

      const userData = {
        ...data.data.user,
        token: data.data.token,
      };

      // Store both user data AND token separately
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, data.data.token); // Store token separately

      return {
        success: true,
        message: data.message || 'Login successful',
        data: userData,
      };
    } catch (error) {
      console.error('Auth login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;

      const user = JSON.parse(raw);
      if (!user?.token) {
        this.logout();
        return null;
      }

      return user;
    } catch {
      this.logout();
      return null;
    }
  },

  getToken() {
    // Try to get token from localStorage first, then from user object
    return localStorage.getItem(TOKEN_KEY) || this.getCurrentUser()?.token;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
};

export default authService;