// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import authService from './services/auth.service';
import './App.css';
import './styles/auth.css';

// Protected Route Component with debugging
const ProtectedRoute = ({ children }) => {
  useEffect(() => {
    console.log('ProtectedRoute - Checking authentication');
    console.log('Token exists:', !!localStorage.getItem('token'));
    console.log('User exists:', !!localStorage.getItem('user'));
  }, []);

  const isAuthenticated = authService.isAuthenticated();
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Authenticated, rendering protected content');
  return children;
};

const App = () => {
  useEffect(() => {
    console.log('App mounted');
    console.log('Initial auth state:', authService.isAuthenticated());
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;