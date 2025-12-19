// src/components/layout/Sidebar.jsx - COMPACT VERSION
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/sidebar.css';

const Sidebar = ({ onMenuToggle }) => {
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
      {/* Logo Section - Compact */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span className="logo-text">N</span>
        </div>
        {!collapsed && (
          <div className="logo-text-container">
            <h3>NCBA Kollect</h3>
            <p className="logo-subtitle">Collections System</p>
          </div>
        )}
        <button 
          className="collapse-btn"
          onClick={handleCollapse}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Menu Items - Compact */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer - Minimal */}
      <div className="sidebar-footer">
        <div className="system-info">
          <p>
            {!collapsed && 'Version 1.0'}
            {collapsed && 'V1.0'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;