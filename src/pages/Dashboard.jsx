// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccountBalanceWallet,
  People,
  AttachMoney,
  Receipt,
  Refresh,
  Error as ErrorIcon
} from '@mui/icons-material';
import api from '../services/api'; // Import the shared instance
import Sidebar from '../components/layout/Sidebar';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors matching your login page
  const colors = {
    primary: '#5c4730',
    secondary: '#3c2a1c',
    accent: '#d4a762',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#c0392b',
    background: '#f8f9fa',
    card: '#FFFFFF',
    textPrimary: '#5c4730',
    textSecondary: '#666666',
    border: '#e8e8e8'
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      
      const response = await api.get('/customers/dashboard/stats'); // Use the shared instance
      console.log('Response:', response);
      
      if (response.data.success) {
        setStats(response.data.data.stats);
      } else {
        setError('Failed to load dashboard data: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setError('Session expired. Please login again.');
        } else if (error.response.status === 404) {
          setError('Dashboard endpoint not found. Check backend routes.');
        } else {
          setError(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        setError('Cannot connect to server. Make sure backend is running on port 5000.');
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

  // ... rest of your Dashboard component remains the same
  // Keep everything from the if (error) block to the end

  if (error) {
    return (
      <Box sx={{ 
        p: 4, 
        backgroundColor: colors.background, 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: 600,
            width: '100%',
            backgroundColor: '#fff5f5',
            border: '1px solid #ffcccc'
          }}
        >
          <AlertTitle>Dashboard Error</AlertTitle>
          <Typography variant="body1" sx={{ mb: 2 }}>{error}</Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: colors.background
      }}>
        <LinearProgress sx={{ width: '50%', mb: 3 }} />
        <Typography variant="h6" sx={{ color: colors.textPrimary }}>
          Loading dashboard...
        </Typography>
      </Box>
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

  const statCards = [
    {
      title: 'Total Customers',
      value: displayStats.totalCustomers.toLocaleString(),
      icon: <People sx={{ fontSize: 32, color: colors.primary }} />,
      subtitle: `Active: ${displayStats.activeCustomers.toLocaleString()}`,
      color: colors.primary,
      bgcolor: '#F5F0EA'
    },
    {
      title: 'Loan Portfolio',
      value: `KES ${displayStats.totalLoanPortfolio.toLocaleString()}`,
      icon: <AccountBalanceWallet sx={{ fontSize: 32, color: colors.secondary }} />,
      subtitle: 'Total outstanding',
      color: colors.secondary,
      bgcolor: '#F2EDE9'
    },
    {
      title: 'Total Collections',
      value: `KES ${displayStats.totalAmountCollected.toLocaleString()}`,
      icon: <AttachMoney sx={{ fontSize: 32, color: colors.accent }} />,
      subtitle: 'Amount collected',
      color: colors.accent,
      bgcolor: '#FAF6F0'
    },
    {
      title: 'Total Arrears',
      value: `KES ${displayStats.totalArrears.toLocaleString()}`,
      icon: <Receipt sx={{ fontSize: 32, color: colors.warning }} />,
      subtitle: 'Pending collections',
      color: colors.warning,
      bgcolor: '#FEF9E7'
    }
  ];

  return (
    <Box sx={{ p: isMobile ? 2 : 4, backgroundColor: colors.background, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: colors.textPrimary,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Collections Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
          >
            Update Dashboard
          </Button>
        </Box>
        <Typography variant="body1" sx={{ color: colors.textSecondary }}>
          Real-time overview of your loan collection performance
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                backgroundColor: card.bgcolor,
                border: `1px solid ${colors.border}`,
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
                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, mb: 0.5 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                      {card.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      <Paper 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textPrimary, mb: 3 }}>
          Performance Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.success }}>
                {displayStats.successfulTransactions}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Successful Transactions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary }}>
                {displayStats.totalTransactions}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Total Transactions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.accent }}>
                KES {displayStats.totalRepayments.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Total Repayments
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.secondary }}>
                {displayStats.totalTransactions > 0 
                  ? `${((displayStats.successfulTransactions / displayStats.totalTransactions) * 100).toFixed(1)}%` 
                  : '0%'}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Success Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;