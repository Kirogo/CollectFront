// src/pages/Dashboard.jsx - UPDATED IMPORTS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Alert,
  AlertTitle,
  IconButton,
  Chip // ADD THIS IMPORT
} from '@mui/material';
import {
  AccountBalanceWallet,
  People,
  AttachMoney,
  Receipt,
  Refresh,
  TrendingUp,
  Payment,
  ArrowUpward,
  ArrowDownward,
  Add,
  TrendingFlat
} from '@mui/icons-material';
import axios from 'axios';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create axios instance with token
  const getAuthAxios = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return null;
    }

    return axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authAxios = getAuthAxios();
      if (!authAxios) return;
      
      // Fetch dashboard stats
      const statsResponse = await authAxios.get('/customers/dashboard/stats');
      
      // Fetch recent customers
      const customersResponse = await authAxios.get('/customers?limit=5');
      
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.stats);
      }
      
      if (customersResponse.data.success) {
        setRecentCustomers(customersResponse.data.data.customers || []);
      }
      
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        } else if (error.response.status === 404) {
          setError('Dashboard endpoint not found. Check backend routes.');
        } else {
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        setError('Cannot connect to server. Make sure backend is running on http://localhost:5000');
      } else {
        setError('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (error && (error.includes('401') || error?.includes('authenticate'))) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-loading">
          <LinearProgress sx={{ width: '50%', mb: 3, height: 8, borderRadius: 4 }} />
          <Typography variant="h6" sx={{ color: '#5c4730' }}>
            Loading dashboard...
          </Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h3>Dashboard Error</h3>
          <p>{error}</p>
          <div className="troubleshooting">
            <p><strong>Troubleshooting steps:</strong></p>
            <ul>
              <li>Make sure backend server is running on port 5000</li>
              <li>Check if you're logged in</li>
              <li>Verify the endpoint /api/customers/dashboard/stats exists</li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </div>
          <button 
            className="retry-btn"
            onClick={fetchDashboardData}
          >
            ↻ Retry
          </button>
        </div>
      </div>
    );
  }

  const displayStats = stats || {
    totalCustomers: 0,
    activeCustomers: 0,
    totalLoanPortfolio: 0,
    totalArrears: 0,
    totalRepayments: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    totalAmountCollected: 0
  };

  // Stat cards with trends
  const statCards = [
    {
      title: 'Total Customers',
      value: displayStats.totalCustomers.toLocaleString(),
      icon: <People sx={{ fontSize: 32, color: '#5c4730' }} />,
      change: '+12.5%',
      trend: 'up',
      color: '#5c4730',
      bgcolor: '#F5F0EA',
      subtitle: `Active: ${displayStats.activeCustomers.toLocaleString()}`
    },
    {
      title: 'Loan Portfolio',
      value: `KES ${displayStats.totalLoanPortfolio.toLocaleString()}`,
      icon: <AccountBalanceWallet sx={{ fontSize: 32, color: '#3c2a1c' }} />,
      change: '+8.2%',
      trend: 'up',
      color: '#3c2a1c',
      bgcolor: '#F2EDE9',
      subtitle: 'Total outstanding'
    },
    {
      title: 'Total Collections',
      value: `KES ${displayStats.totalAmountCollected.toLocaleString()}`,
      icon: <AttachMoney sx={{ fontSize: 32, color: '#d4a762' }} />,
      change: '+15.3%',
      trend: 'up',
      color: '#d4a762',
      bgcolor: '#FAF6F0',
      subtitle: 'Amount collected'
    },
    {
      title: 'Total Arrears',
      value: `KES ${displayStats.totalArrears.toLocaleString()}`,
      icon: <Receipt sx={{ fontSize: 32, color: '#f39c12' }} />,
      change: '-3.2%',
      trend: 'down',
      color: '#f39c12',
      bgcolor: '#FEF9E7',
      subtitle: 'Pending collections'
    }
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-top">
          <h1 className="dashboard-title">
            Collections Dashboard
          </h1>
          <button 
            className="refresh-btn"
            onClick={fetchDashboardData}
          >
            <Refresh sx={{ fontSize: 18, marginRight: 1 }} />
            Refresh
          </button>
        </div>
        <p className="dashboard-subtitle">
          Welcome back! Here's your collection performance overview
        </p>
      </div>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                backgroundColor: card.bgcolor,
                border: '1px solid #e8e8e8',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(92, 71, 48, 0.1)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 600, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, mb: 0.5 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666666', display: 'block', mb: 1 }}>
                      {card.subtitle}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {card.trend === 'up' ? (
                        <ArrowUpward sx={{ fontSize: 14, color: '#27ae60' }} />
                      ) : card.trend === 'down' ? (
                        <ArrowDownward sx={{ fontSize: 14, color: '#c0392b' }} />
                      ) : (
                        <TrendingFlat sx={{ fontSize: 14, color: '#666' }} />
                      )}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: card.trend === 'up' ? '#27ae60' : 
                                card.trend === 'down' ? '#c0392b' : '#666',
                          fontWeight: 500
                        }}
                      >
                        {card.change} from last month
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: 'white', 
                    p: 1.5, 
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Customers & Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Customers */}
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              backgroundColor: 'white',
              border: '1px solid #e8e8e8',
              boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730' }}>
                Recent Collections
              </Typography>
            </Box>
            
            {recentCustomers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No customers found</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentCustomers.map((customer) => (
                  <Box 
                    key={customer.id}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #e8e8e8',
                      backgroundColor: '#f8f9fa',
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#f5f0ea',
                        borderColor: '#d4a762',
                        cursor: 'pointer',
                        transform: 'translateX(5px)'
                      }
                    }}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#5c4730' }}>
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {customer.phoneNumber} • {customer.accountNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#5c4730' }}>
                        KES {parseFloat(customer.loanBalance || 0).toLocaleString()}
                      </Typography>
                      <Chip // THIS WAS CAUSING THE ERROR - NOW FIXED
                        label={parseFloat(customer.arrears || 0) === 0 ? 'Current' : 'Arrears'}
                        size="small"
                        sx={{
                          backgroundColor: parseFloat(customer.arrears || 0) === 0 ? '#ecfdf5' : '#fef2f2',
                          color: parseFloat(customer.arrears || 0) === 0 ? '#059669' : '#dc2626',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              backgroundColor: 'white',
              border: '1px solid #e8e8e8',
              boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)',
              height: '100%'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730', mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {[
                { 
                  label: 'Customers', 
                  icon: '👥', 
                  color: '#5c4730', 
                  bg: '#F5F0EA',
                  onClick: () => navigate('/customers/new')
                },
                { 
                  label: 'Process Payment', 
                  icon: '💰', 
                  color: '#d4a762', 
                  bg: '#FAF6F0',
                  onClick: () => navigate('/payments')
                },
                { 
                  label: 'View Reports', 
                  icon: '📊', 
                  color: '#3c2a1c', 
                  bg: '#F2EDE9',
                  onClick: () => navigate('/reports')
                },
                { 
                  label: 'Transactions', 
                  icon: '📝', 
                  color: '#27ae60', 
                  bg: '#ECFDF5',
                  onClick: () => navigate('/transactions')
                }
              ].map((action, index) => (
                <Grid item xs={6} key={index}>
                  <Button
                    fullWidth
                    onClick={action.onClick}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: action.bg,
                      color: action.color,
                      border: '1px solid #e8e8e8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: action.bg,
                        borderColor: action.color,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{action.icon}</span>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {action.label}
                    </Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Stats 
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              backgroundColor: 'white',
              border: '1px solid #e8e8e8',
              boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730', mb: 3 }}>
              Collection Performance
            </Typography>
            <Box>
              {[
                { label: 'Success Rate', value: displayStats.totalTransactions > 0 ? ((displayStats.successfulTransactions / displayStats.totalTransactions) * 100).toFixed(1) : 0, color: '#27ae60' },
                { label: 'Avg Transaction', value: `KES ${displayStats.totalTransactions > 0 ? (displayStats.totalAmountCollected / displayStats.totalTransactions).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 0}`, color: '#d4a762' },
                { label: 'Daily Average', value: `KES ${(displayStats.totalAmountCollected / 30).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#5c4730' }
              ].map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666' }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: item.color }}>{item.value}{typeof item.value === 'number' ? '%' : ''}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={typeof item.value === 'string' ? 100 : item.value} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: `${item.color}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.color,
                        borderRadius: 3
                      }
                    }} 
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              backgroundColor: 'white',
              border: '1px solid #e8e8e8',
              boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730', mb: 3 }}>
              System Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Backend API', status: 'Online', color: '#27ae60' },
                { label: 'Database', status: 'Connected', color: '#27ae60' },
                { label: 'MPesa Gateway', status: 'Active', color: '#27ae60' },
                { label: 'SMS Service', status: 'Ready', color: '#d4a762' }
              ].map((item, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e8e8e8',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#5c4730', fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                  <Chip // THIS ALSO NEEDED THE IMPORT
                    label={item.status}
                    size="small"
                    sx={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                      fontWeight: 500
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>*/}
    </div>
  );
};

export default Dashboard;