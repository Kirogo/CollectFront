// src/components/Auth/Login.jsx - With backend status
import React, { useState } from 'react';
import '../../../src/styles/components.css';

const Login = ({ onLogin, loading, error, backendStatus = 'connected' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onLogin(username, password);
    }
  };

  // Auto-fill test credentials for easier testing
  const useTestCredentials = () => {
    setUsername('staff');
    setPassword('password123');
  };

  return (
    <div className="login-compact-wrapper">
      {/* Backend Status Indicator */}
      {backendStatus === 'disconnected' && (
        <div className="backend-warning">
          <span className="warning-icon">⚠️</span>
          <span>Backend not connected. Make sure it's running on port 5000.</span>
        </div>
      )}
      
      <div className="login-compact-container">
        {/* Left Panel - Branding */}
        <div className="login-compact-left">
          <div className="compact-ncba-logo">
            <div className="compact-logo-circle">
              <span className="compact-logo-text">NCBA</span>
            </div>
          </div>
          <h2 className="compact-subtitle">Collections Department</h2>
          <p className="compact-tagline">STK Push Loan Repayment System</p>
          
          <div className="compact-features">
            <div className="compact-feature">
              <div className="compact-feature-icon">🔒</div>
              <div className="compact-feature-text">Secure Staff Access</div>
            </div>
            <div className="compact-feature">
              <div className="compact-feature-icon">💰</div>
              <div className="compact-feature-text">Direct MPesa Payments</div>
            </div>
            <div className="compact-feature">
              <div className="compact-feature-icon">⚡</div>
              <div className="compact-feature-text">Real-time Processing</div>
            </div>
          </div>
          
          {/* Test Credentials Button */}
          <button 
            onClick={useTestCredentials}
            className="test-credentials-btn"
            type="button"
          >
            Use Test Credentials
          </button>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-compact-right">
          <div className="compact-form-card">
            <div className="compact-form-header">
              <h3>Staff Login</h3>
              <p>Enter username or email with password</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="compact-form-error">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="compact-form-group">
                <label>
                  <span className="label-icon">👤</span>
                  Username or Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="staff or staff@ncbabank.co.ke"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="compact-form-group">
                <label>
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !username || !password}
                className="compact-login-btn"
              >
                {loading ? (
                  <>
                    <span className="compact-spinner"></span>
                    Authenticating...
                  </>
                ) : (
                  'Login to System'
                )}
              </button>

              <div className="compact-form-footer">
                <div className="security-info">
                  <span className="shield-icon">🛡️</span>
                  <span>Authorized personnel only</span>
                </div>
                <div className="support-contact">
                  Backend Status: 
                  <span className={`status-indicator ${backendStatus}`}>
                    {backendStatus === 'connected' ? '✅ Connected' : 
                     backendStatus === 'disconnected' ? '❌ Disconnected' : '⚠️ Checking'}
                  </span>
                </div>
              </div>
            </form>

            <div className="compact-version">
              <span>v2.1.4 • Collections Module</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;