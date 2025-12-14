// src/styles/theme.js
export const colors = {
  // Primary colors (from login page)
  primary: '#5c4730',      // Brown
  secondary: '#3c2a1c',    // Dark brown
  accent: '#d4a762',       // Gold
  
  // Status colors
  success: '#27ae60',      // Green
  warning: '#f39c12',      // Orange
  danger: '#c0392b',       // Red
  
  // Neutrals
  background: '#f8f9fa',
  card: '#FFFFFF',
  textPrimary: '#5c4730',
  textSecondary: '#666666',
  border: '#e8e8e8',
  sidebarBg: '#5c4730',
  sidebarText: '#ffffff',
  sidebarHover: '#3c2a1c'
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
  h1: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2
  },
  h2: {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1.3
  },
  h3: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 1.4
  },
  body: {
    fontSize: '14px',
    lineHeight: 1.5
  },
  caption: {
    fontSize: '12px',
    lineHeight: 1.4
  }
};

export const shadows = {
  small: '0 2px 8px rgba(92, 71, 48, 0.1)',
  medium: '0 4px 12px rgba(92, 71, 48, 0.05)',
  large: '0 8px 24px rgba(92, 71, 48, 0.1)',
  sidebar: '4px 0 20px rgba(0, 0, 0, 0.15)'
};

export const borderRadius = {
  small: '6px',
  medium: '12px',
  large: '20px',
  pill: '50px'
};