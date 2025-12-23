// src/App.jsx - FINAL WORKING VERSION
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CustomerPage from './pages/CustomerPage';
import ReportsPage from './pages/ReportsPage';
import CustomerDetails from './pages/CustomerDetails';
import PaymentPage from './pages/PaymentPage';
import TransactionsPage from './pages/TransactionsPage';
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
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
              <CustomerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <CustomerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route path="/" element={
          authService.isAuthenticated() ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </Router>
  );
}

export default App;