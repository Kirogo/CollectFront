import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button
} from "@mui/material";
import {
  AccountBalanceWallet,
  People,
  Receipt,
  Refresh,
  Payment,
  Assessment,
  ReceiptLong,
  ArrowForward,
  LibraryAdd,
  LibraryAddCheck,
  PeopleAlt,
  CheckCircle,
  Cancel,
  AccessTime
} from "@mui/icons-material";
import axios from "axios";
import authService from "../services/auth.service";
import "../styles/dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getApi = () => {
    const token = authService.getToken();
    return axios.create({
      baseURL: "http://localhost:5000/api",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const api = getApi();
      
      const [statsRes, transactionsRes] = await Promise.all([
        api.get("/customers/dashboard/stats"),
        api.get("/payments/recent-transactions") // NEW ENDPOINT
      ]);

      setStats(statsRes.data.data.stats);
      setRecentTransactions(transactionsRes.data.data.transactions || []);
    } catch (err) {
      console.error("Dashboard error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load dashboard data");
      
      if (err.response?.status === 401) {
        authService.logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#5c4730' }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#c0392b', mb: 2 }}>
          {error}
        </Typography>
        <Button 
          onClick={fetchDashboardData} 
          sx={{ 
            mt: 2,
            background: '#5c4730',
            color: 'white',
            fontWeight: 600,
            '&:hover': { background: '#3c2a1c' }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const displayStats = stats || {};

  // Minimal stat cards data
  const statCards = [
    {
      title: "Total Customers",
      value: displayStats.totalCustomers || 0,
      icon: <People />
    },
    {
      title: "Loan Portfolio",
      value: Number(displayStats.totalLoanPortfolio || 0).toLocaleString(),
      icon: <AccountBalanceWallet />,
      isCurrency: true
    },
    {
      title: "Collections",
      value: Number(displayStats.totalAmountCollected || 0).toLocaleString(),
      icon: <LibraryAddCheck />,
      isCurrency: true
    },
    {
      title: "Arrears",
      value: Number(displayStats.totalArrears || 0).toLocaleString(),
      icon: <LibraryAdd />,
      isCurrency: true
    }
  ];

  // Quick actions
  const quickActions = [
    {
      label: "Customer",
      icon: <PeopleAlt />,
      path: "/customers"
    },
    {
      label: "Process Payment",
      icon: <Payment />,
      path: "/payments"
    },
    {
      label: "View Reports",
      icon: <Assessment />,
      path: "/reports"
    },
    {
      label: "Transactions",
      icon: <ReceiptLong />,
      path: "/transactions"
    }
  ];

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle sx={{ fontSize: 14, color: '#2ecc71' }} />;
      case 'FAILED':
        return <Cancel sx={{ fontSize: 14, color: '#e74c3c' }} />;
      case 'PENDING':
        return <AccessTime sx={{ fontSize: 14, color: '#f39c12' }} />;
      case 'EXPIRED':
        return <Cancel sx={{ fontSize: 14, color: '#95a5a6' }} />;
      case 'CANCELLED':
        return <Cancel sx={{ fontSize: 14, color: '#7f8c8d' }} />;
      default:
        return <AccessTime sx={{ fontSize: 14, color: '#f39c12' }} />;
    }
  };

  // Get status text color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS': return '#2ecc71';
      case 'FAILED': return '#e74c3c';
      case 'PENDING': return '#f39c12';
      case 'EXPIRED': return '#95a5a6';
      case 'CANCELLED': return '#7f8c8d';
      default: return '#f39c12';
    }
  };

  // Format amount
  const formatAmount = (amount) => {
    const numAmount = Number(amount || 0);
    return `KES ${numAmount.toLocaleString()}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Handle transaction click
  const handleTransactionClick = (transaction) => {
    navigate(`/transactions/${transaction._id}`);
  };

  return (
    <Box className="dashboard-wrapper">
      {/* Header */}
      <Box className="dashboard-header">
        <Box className="header-content">
          <Box>
            <Typography className="dashboard-subtitle">
              Overview of Arrears Portfolio & Collections
            </Typography>
          </Box>
          <button 
            className="minimal-refresh-btn" 
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <Refresh sx={{ fontSize: 18 }} />
            Refresh
          </button>
        </Box>
      </Box>

      {/* Minimal Stats Grid */}
      <div className="minimal-stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="minimal-stat-card">
            <div className="stat-header">
              <div className="stat-label">{card.title}</div>
              <div className="stat-icon-wrapper">
                {card.icon}
              </div>
            </div>
            <div>
              <div className="stat-value">
                {card.isCurrency ? `KES ${card.value}` : card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal Layout: Recent Transactions (65%) + Quick Actions (35%) */}
      <Box className="dashboard-main">
        {/* Recent Transactions Section - 65% */}
        <Box className="recent-customers-section">
          <div className="recent-customers-card">
            <div className="section-header">
              <Typography className="section-title">
                Recent Transactions
              </Typography>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/transactions')}
              >
                View All
              </button>
            </div>
            
            <div className="customers-list">
              {recentTransactions.length === 0 ? (
                <div className="customers-empty-state">
                  <div className="empty-icon">💳</div>
                  <Typography className="empty-title">
                    No Recent Transactions
                  </Typography>
                  <Typography className="empty-subtitle">
                    Process a payment to see transactions here
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/payments')}
                    sx={{
                      background: '#5c4730',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      padding: '8px 20px',
                      '&:hover': { background: '#3c2a1c' }
                    }}
                  >
                    Process Payment
                  </Button>
                </div>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <div 
                    key={transaction._id || index} 
                    className="customer-row"
                    onClick={() => handleTransactionClick(transaction)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="customer-info">
                      <Typography className="customer-name">
                        {transaction.customerId?.name || 'Unknown Customer'}
                      </Typography>
                      <Typography className="customer-phone">
                        {transaction.phoneNumber || 'N/A'}
                      </Typography>
                      <Typography className="transaction-date" style={{ fontSize: '0.7rem', color: '#666' }}>
                        {formatDate(transaction.createdAt)}
                      </Typography>
                    </div>
                    <div className="arrears-info">
                      <Typography className="arrears-amount" style={{ color: getStatusColor(transaction.status) }}>
                        {formatAmount(transaction.amount)}
                        <span style={{ marginLeft: '6px' }}>
                          {getStatusIcon(transaction.status)}
                        </span>
                      </Typography>
                      <Typography className="arrears-label" style={{ color: getStatusColor(transaction.status) }}>
                        {transaction.status || 'PENDING'}
                      </Typography>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Box>

        {/* Quick Actions Section - 35% */}
        <Box className="quick-actions-section">
          <div className="quick-actions-card">
            <div className="section-header">
              <Typography className="section-title">
                Quick Actions
              </Typography>
            </div>
            
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  className="quick-action-item"
                  onClick={() => navigate(action.path)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    {action.icon}
                  </div>
                  <Typography className="action-label">
                    {action.label}
                  </Typography>
                </a>
              ))}
            </div>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;