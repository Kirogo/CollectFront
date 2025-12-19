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
  AttachMoney,
  Receipt,
  Refresh,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Payment,
  Assessment,
  ReceiptLong,
  PersonAdd,
  ArrowForward,
  LibraryAdd,
  LibraryAddCheck,
  PeopleAlt
} from "@mui/icons-material";
import axios from "axios";
import authService from "../services/auth.service";
import "../styles/dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState([]);
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
      
      const [statsRes, customersRes] = await Promise.all([
        api.get("/customers/dashboard/stats"),
        api.get("/customers?limit=5")
      ]);

      setStats(statsRes.data.data.stats);
      setRecentCustomers(customersRes.data.data.customers || []);
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

  // Format arrears amount
  const formatArrears = (amount) => {
    const numAmount = Number(amount || 0);
    return numAmount === 0 ? "KES 0" : `KES ${numAmount.toLocaleString()}`;
  };

  return (
    <Box className="dashboard-wrapper">
      {/* Header */}
      <Box className="dashboard-header">
        <Box className="header-content">
          <Box>
            <Typography className="dashboard-title">
              Collections Dashboard
            </Typography>
            <Typography className="dashboard-subtitle">
              Overview of loan portfolio and collections
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

      {/* Horizontal Layout: Recent Customers (65%) + Quick Actions (35%) */}
      <Box className="dashboard-main">
        {/* Recent Customers Section - 65% */}
        <Box className="recent-customers-section">
          <div className="recent-customers-card">
            <div className="section-header">
              <Typography className="section-title">
                Recent Customers
              </Typography>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/customers')}
              >
                View All <ArrowForward sx={{ fontSize: 14, ml: 0.5 }} />
              </button>
            </div>
            
            <div className="customers-list">
              {recentCustomers.length === 0 ? (
                <div className="customers-empty-state">
                  <div className="empty-icon">👥</div>
                  <Typography className="empty-title">
                    No Customers Found
                  </Typography>
                  <Typography className="empty-subtitle">
                    Start by adding your first customer
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/customers/new')}
                    sx={{
                      background: '#5c4730',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      padding: '8px 20px',
                      '&:hover': { background: '#3c2a1c' }
                    }}
                  >
                    Add Customer
                  </Button>
                </div>
              ) : (
                recentCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="customer-row"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <div className="customer-info">
                      <Typography className="customer-name">
                        {customer.name || 'Unknown Customer'}
                      </Typography>
                      <Typography className="customer-phone">
                        {customer.phoneNumber || 'N/A'}
                      </Typography>
                    </div>
                    <div className="arrears-info">
                      <Typography className="arrears-amount">
                        {formatArrears(customer.arrears)}
                      </Typography>
                      <Typography className="arrears-label">
                        Arrears to Clear
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