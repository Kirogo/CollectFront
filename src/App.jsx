// src/App.jsx - Updated imports
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import authService from './services/auth.service';

// Import styles
import './styles/auth.css';
import './styles/sidebar.css';
import './styles/navbar.css';
import './styles/dashboard.css';

// Protected Layout component
const ProtectedLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        onMenuToggle={toggleSidebar} 
        user={authService.getCurrentUser()}
      />
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarCollapsed ? '80px' : '280px',
        transition: 'margin-left 0.3s ease'
      }}>
        <Navbar onMenuToggle={toggleSidebar} />
        <main style={{ 
          marginTop: '70px', 
          padding: '20px',
          minHeight: 'calc(100vh - 70px)',
          backgroundColor: '#f8f9fa'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <ProtectedLayout>{children}</ProtectedLayout>;
};

// Create a placeholder for CustomerPage if it doesn't exist
const CustomerPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>Customers</h2>
    <p>Customer management page coming soon...</p>
  </div>
);

// Create a placeholder for PaymentPage
const PaymentPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>Payments</h2>
    <p>Payment processing page coming soon...</p>
  </div>
);

function App() {
  return (
    <Router>
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
          path="/customers" 
          element={
            <ProtectedRoute>
              <CustomerPage /> {/* Using local component */}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payments" 
          element={
            <ProtectedRoute>
              <PaymentPage /> {/* Using local component */}
            </ProtectedRoute>
          } 
        />
        {/* Add other routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;