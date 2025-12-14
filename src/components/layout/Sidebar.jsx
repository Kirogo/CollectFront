// src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../../src/styles/components.css';

const Sidebar = ({ user, onLogout }) => {
  const menuItems = [
    {
      title: 'Collections Dashboard',
      items: [
        { path: '/', label: 'STK Push Repayment', icon: '💰' },
        { path: '/overview', label: '360 View', icon: '📊' },
        { path: '/metrics', label: 'Performance Metrics', icon: '📈' },
      ],
    },
    {
      title: 'Customer Management',
      items: [
        { path: '/customers', label: 'Customer Search', icon: '🔍' },
        { path: '/workload', label: 'Work Load Enquiry', icon: '📋' },
        { path: '/referrals', label: 'Referral Enquiry', icon: '🔄' },
        { path: '/ptp', label: 'PTP Enquiry', icon: '🤝' },
        { path: '/statistics', label: 'Kollect Statistics', icon: '📊' },
        { path: '/debt-cards', label: 'Debt Card Enquiry', icon: '💳' },
      ],
    },
    {
      title: 'Modules',
      items: [
        { path: '/crb', label: 'CRB Menu', icon: '📋' },
        { path: '/ecd', label: 'ECD Process', icon: '⚙️' },
        { path: '/reports', label: 'Reports', icon: '📄' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
      ],
    },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>NCBA Collections</h3>
        <div className="user-info">
          <span className="user-role">{user?.role || 'Staff'}</span>
          <span className="user-name">{user?.name || user?.email}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((section, index) => (
          <div key={index} className="menu-section">
            <h4>{section.title}</h4>
            <ul>
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="system-status">
          <h4>System Status</h4>
          <div className="status-indicator active">
            <span className="status-dot"></span>
            Backend Connected
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;