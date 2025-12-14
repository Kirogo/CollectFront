// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Auth/Login';
import authService from '../services/auth.service';
import customerService from '../services/customer.service';
import '../styles/auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (err) {
      console.log('Backend not reachable:', err.message);
      setBackendStatus('disconnected');
    }
  };

  const handleLogin = async (username, password) => {
    console.log('=== LOGIN PROCESS STARTED ===');
    console.log('Username:', username);
    console.log('Password length:', password?.length || 0);
    
    setLoading(true);
    setError('');
    
    try {
      // First, check if user is already logged in
      if (authService.isAuthenticated()) {
        console.log('User already authenticated, redirecting...');
        navigate('/dashboard');
        return;
      }

      // Validate input
      if (!username.trim() || !password.trim()) {
        setError('Please enter both username and password');
        setLoading(false);
        return;
      }

      console.log('Calling authService.login...');
      
      // Call the auth service
      const result = await authService.login(username, password);
      
      console.log('Auth service result:', result);
      
      if (result.success) {
        console.log('Login successful!');
        console.log('Token in localStorage:', localStorage.getItem('token'));
        console.log('User in localStorage:', localStorage.getItem('user'));
        
        // Verify authentication was saved
        if (!authService.isAuthenticated()) {
          console.error('Authentication not saved properly!');
          setError('Login failed - authentication error');
          setLoading(false);
          return;
        }
        
        // Try to load customers (optional, can be done in Dashboard)
        try {
          console.log('Attempting to load customers...');
          const customersResult = await customerService.getAllCustomers();
          console.log('Customers loaded:', customersResult.success);
        } catch (customerErr) {
          console.warn('Could not load customers:', customerErr.message);
          // Continue anyway - customers can be loaded later
        }
        
        console.log('Navigating to dashboard...');
        
        // Force navigation with a small delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
        
      } else {
        console.log('Login failed:', result.message);
        setError(result.message);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== LOGIN PROCESS COMPLETED ===');
    }
  };

  // Add backend status info to error if backend is disconnected
  const getErrorMessage = () => {
    if (backendStatus === 'disconnected') {
      return `${error} (Backend not connected - run "npm run dev" in backend folder)`;
    }
    return error;
  };

  return (
    <Login 
      onLogin={handleLogin}
      loading={loading}
      error={getErrorMessage()}
      backendStatus={backendStatus}
    />
  );
};

export default LoginPage;