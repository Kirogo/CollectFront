// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';
import '../../styles/navbar.css';

const Navbar = ({ title, onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/transactions')) return 'Transactions';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    return 'NCBA Collections';
  };

  const pageTitle = getPageTitle();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle-btn" onClick={onMenuToggle}>
          ☰
        </button>
        <div className="page-title">
          <h2>{pageTitle}</h2>
          <p className="page-subtitle">
            {user?.role === 'ADMIN' ? '' : 
             user?.role === 'SUPERVISOR' ? '' : 
             ''}
          </p>
        </div>
      </div>

      <div className="navbar-right">
        {/* Notifications */}
        <button className="nav-icon-btn">
          <span className="icon">🔔</span>
          <span className="badge">3</span>
        </button>

        {/* User Profile */}
        <div className="user-profile">
          <button 
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'Staff'}</span>
            </div>
            <span className="dropdown-icon">▼</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4>{user?.name || 'User'}</h4>
                  <p>{user?.email || user?.username || 'user@ncbabank.co.ke'}</p>
                  <p className="role-badge">{user?.role || 'Staff'}</p>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item">
                <span className="icon">👤</span>
                My Profile
              </button>
              <button className="dropdown-item">
                <span className="icon">⚙️</span>
                Settings
              </button>
              <button className="dropdown-item">
                <span className="icon">🆘</span>
                Help & Support
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <span className="icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;