// src/components/layout/Sidebar.jsx - UPDATED VERSION
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../styles/theme';

const Sidebar = ({ user, onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/dashboard'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: '👥',
      path: '/customers'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: '📝',
      path: '/transactions'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📈',
      path: '/reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/settings'
    }
  ];

  const handleCollapse = () => {
    setCollapsed(!collapsed);
    if (onMenuToggle) onMenuToggle();
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ backgroundColor: colors.accent }}>
          <span className="logo-text">N</span>
        </div>
        {!collapsed && (
          <div className="logo-text-container">
            <h3 style={{ color: colors.sidebarText }}>NCBA Kollect</h3>
            <p className="logo-subtitle" style={{ color: colors.accent }}>Loan Repayment System</p>
          </div>
        )}
        <button 
          className="collapse-btn"
          onClick={handleCollapse}
          style={{ color: colors.sidebarText }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              style={{
                backgroundColor: isActive ? colors.accent + '20' : 'transparent',
                color: isActive ? colors.accent : colors.sidebarText
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer - Simplified */}
      <div className="sidebar-footer">
        <div className="system-info">
          <p style={{ color: colors.sidebarText, opacity: 0.7, fontSize: '12px' }}>
            {!collapsed && 'Version 1.0.0'}
            {collapsed && 'V1.0'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;