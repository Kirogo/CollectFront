// src/services/auth.service.js
import api from './api'; // This imports the default export

const authService = {
  // Login staff member - supports both username or email
  login: async (identifier, password) => {
    try {
      console.log('Login attempt with identifier:', identifier);
      
      // Determine if it's an email
      const isEmail = identifier.includes('@');
      const loginData = {
        [isEmail ? 'email' : 'username']: identifier,
        password,
      };
      
      console.log('Sending to backend:', loginData);
      
      const response = await api.post('/auth/login', loginData);
        
      console.log('Backend response:', response.data); // Changed from response to response.data
      
      // Check the response structure
      if (response.data.success && response.data.token) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Login successful, token saved');
        return { success: true, data: response.data };
      }
      
      console.log('Login failed:', response.data.message);
      return { 
        success: false, 
        message: response.data.message || 'Login failed. Check your credentials.' 
      };
    } catch (error) {
      console.error('Login API error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Make sure backend is running on port 5000.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Login endpoint not found. Check backend routes.';
      }
      
      return { 
        success: false, 
        message: errorMessage,
        details: error.message 
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export default authService;