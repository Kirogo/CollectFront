// src/pages/ReportsPage.jsx - PROFESSIONAL REPORTS PAGE (UPDATED WITH NAVBAR & SIDEBAR - FIXED LAYOUT)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress
} from '@mui/material';
import {
  Refresh,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Assessment,
  Receipt,
  People,
  AccountBalanceWallet,
  Payment,
  CalendarToday,
  AttachMoney,
  ShowChart,
  InsertChart,
  TrendingFlat,
  ArrowForward,
  PictureAsPdf,
  FileCopy,
  Email,
  FilterAlt,
  DateRange,
  Sort,
  Search
} from '@mui/icons-material';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import '../styles/reportspage.css';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('week');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [activeFilters, setActiveFilters] = useState(['successful']);
  
  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalCollections: 0,
    dailyCollections: 0,
    successfulTransactions: 0,
    activeCustomers: 0,
    collectionRate: 0,
    avgTransaction: 0,
    portfolioValue: 0,
    arrearsAmount: 0,
    thisWeekChange: 0,
    thisMonthChange: 0,
    todayPerformance: 0
  });
  
  // Report data
  const [reportData, setReportData] = useState({
    transactions: [],
    customers: [],
    collections: [],
    performance: []
  });

  // Initialize dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    setFromDate(weekAgoStr);
    setToDate(today);
  }, []);

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const authAxios = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Calculate date range for API calls
      let startDate, endDate;
      const today = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = startDate;
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = yesterday.toISOString().split('T')[0];
          endDate = startDate;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          startDate = monthAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'custom':
          startDate = fromDate;
          endDate = toDate;
          break;
        default:
          startDate = today.toISOString().split('T')[0];
          endDate = startDate;
      }

      // Fetch all report data
      const [summaryRes, transactionsRes, customersRes] = await Promise.all([
        authAxios.get(`/reports/summary?startDate=${startDate}&endDate=${endDate}`),
        authAxios.get(`/transactions?startDate=${startDate}&endDate=${endDate}`),
        authAxios.get(`/customers/stats?date=${endDate}`)
      ]);

      if (summaryRes.data.success) {
        const stats = summaryRes.data.data || {};
        // Calculate additional metrics
        const thisWeekChange = Math.random() * 20 - 5; // Sample data
        const thisMonthChange = Math.random() * 30 - 10; // Sample data
        const todayPerformance = Math.random() * 15; // Sample data
        
        setSummaryStats({
          ...stats,
          thisWeekChange: parseFloat(thisWeekChange.toFixed(1)),
          thisMonthChange: parseFloat(thisMonthChange.toFixed(1)),
          todayPerformance: parseFloat(todayPerformance.toFixed(1))
        });
      }

      if (transactionsRes.data.success) {
        setReportData(prev => ({
          ...prev,
          transactions: transactionsRes.data.data.transactions || []
        }));
      }

      if (customersRes.data.success) {
        setReportData(prev => ({
          ...prev,
          customers: customersRes.data.data || []
        }));
      }

      // Calculate collections data
      const transactions = transactionsRes.data.success ? transactionsRes.data.data.transactions || [] : [];
      const successfulCollections = transactions.filter(t => t.status?.toUpperCase() === 'SUCCESS');
      const totalCollections = successfulCollections.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      setReportData(prev => ({
        ...prev,
        collections: successfulCollections,
        performance: calculatePerformanceData(successfulCollections, startDate, endDate)
      }));

    } catch (error) {
      console.error('Error fetching reports:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      // Fallback with sample data for demo
      setError('Using sample data (API connection failed)');
      setSampleData();
      
    } finally {
      setLoading(false);
    }
  };

  // Set sample data for demo
  const setSampleData = () => {
    const sampleStats = {
      totalCollections: 1250000,
      dailyCollections: 45000,
      successfulTransactions: 125,
      activeCustomers: 85,
      collectionRate: 94.5,
      avgTransaction: 10000,
      portfolioValue: 8500000,
      arrearsAmount: 450000,
      thisWeekChange: 12.5,
      thisMonthChange: 18.3,
      todayPerformance: 8.2
    };
    
    setSummaryStats(sampleStats);
    
    // Sample collections data for chart
    const sampleCollections = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 100000) + 20000
      };
    });
    
    setReportData({
      transactions: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        amount: Math.floor(Math.random() * 50000) + 5000,
        status: ['SUCCESS', 'FAILED', 'PENDING'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })),
      customers: Array.from({ length: 85 }, (_, i) => ({
        id: i + 1,
        status: ['CURRENT', 'WARNING', 'DELINQUENT'][Math.floor(Math.random() * 3)],
        arrears: Math.floor(Math.random() * 50000)
      })),
      collections: sampleCollections,
      performance: sampleCollections
    });
  };

  // Calculate performance data
  const calculatePerformanceData = (collections, startDate, endDate) => {
    // This would normally process the collections data
    return collections.slice(-7); // Return last 7 collections for chart
  };

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, fromDate, toDate]);

  // Format currency
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range !== 'custom') {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      switch (range) {
        case 'today':
          setFromDate(today.toISOString().split('T')[0]);
          setToDate(today.toISOString().split('T')[0]);
          break;
        case 'yesterday':
          setFromDate(yesterday.toISOString().split('T')[0]);
          setToDate(yesterday.toISOString().split('T')[0]);
          break;
        case 'week':
          setFromDate(weekAgo.toISOString().split('T')[0]);
          setToDate(today.toISOString().split('T')[0]);
          break;
        case 'month':
          setFromDate(monthAgo.toISOString().split('T')[0]);
          setToDate(today.toISOString().split('T')[0]);
          break;
      }
    }
  };

  // Handle generate report
  const handleGenerateReport = (reportType) => {
    setSelectedReport(reportType);
    setShowGenerateModal(true);
  };

  // Export report
  const handleExportReport = async (format = 'pdf') => {
    try {
      setGeneratingReport(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/reports/export/${selectedReport}?format=${format}&startDate=${fromDate}&endDate=${toDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `${selectedReport}_report_${fromDate}_to_${toDate}.${format}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowGenerateModal(false);
      setSelectedReport(null);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      // Fallback: Create sample report
      alert(`Sample ${selectedReport} report would be downloaded here.`);
      setShowGenerateModal(false);
      setSelectedReport(null);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Toggle filter
  const toggleFilter = (filter) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Render chart (simplified for this example)
  const renderCollectionsChart = () => {
    return (
      <div className="chart-container">
        {/* In a real app, you would use a charting library like Chart.js or Recharts */}
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          padding: '1rem'
        }}>
          {reportData.performance.map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '30px',
                height: `${Math.min((item.amount / 100000) * 200, 200)}px`,
                background: 'linear-gradient(to top, #5c4730, #d4a762)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease'
              }} />
              <div style={{
                fontSize: '10px',
                color: '#666',
                fontWeight: '600',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)'
              }}>
                {new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // KPIs Dashboard - Replaced the repetitive cards
  const kpiDashboard = [
    {
      title: 'Weekly Performance',
      value: `${summaryStats.thisWeekChange > 0 ? '+' : ''}${summaryStats.thisWeekChange || 0}%`,
      description: 'vs last week',
      icon: <TrendingUp />,
      trend: summaryStats.thisWeekChange > 0 ? 'up' : 'down',
      color: summaryStats.thisWeekChange > 0 ? '#27ae60' : '#c0392b'
    },
    {
      title: 'Monthly Growth',
      value: `${summaryStats.thisMonthChange > 0 ? '+' : ''}${summaryStats.thisMonthChange || 0}%`,
      description: 'vs last month',
      icon: <ShowChart />,
      trend: summaryStats.thisMonthChange > 0 ? 'up' : 'down',
      color: summaryStats.thisMonthChange > 0 ? '#27ae60' : '#c0392b'
    },
    {
      title: 'Today\'s Efficiency',
      value: `${summaryStats.todayPerformance || 0}%`,
      description: 'collection rate',
      icon: <InsertChart />,
      trend: 'up',
      color: '#5c4730'
    },
    {
      title: 'Avg. Response Time',
      value: '2.4 hrs',
      description: 'from payment to clearance',
      icon: <CalendarToday />,
      trend: 'steady',
      color: '#d4a762'
    }
  ];

  // Quick filters
  const quickFilters = [
    { id: 'successful', label: 'Successful', icon: '✅', count: summaryStats.successfulTransactions || 0 },
    { id: 'failed', label: 'Failed', icon: '❌', count: 5 },
    { id: 'pending', label: 'Pending', icon: '⏳', count: 12 },
    { id: 'delinquent', label: 'Delinquent', icon: '⚠️', count: Math.floor((summaryStats.activeCustomers || 0) * 0.1) },
    { id: 'high-value', label: 'High Value', icon: '💰', count: 8 }
  ];

  // Sort options
  const sortOptions = [
    { id: 'date', label: 'Date', icon: <DateRange /> },
    { id: 'amount', label: 'Amount', icon: <AttachMoney /> },
    { id: 'customer', label: 'Customer', icon: <People /> },
    { id: 'status', label: 'Status', icon: <Sort /> }
  ];

  // Report cards
  const reportCards = [
    {
      title: 'Transactions Report',
      description: 'Detailed breakdown of all payment transactions',
      icon: <Receipt />,
      iconColor: '#b78a5aff',
      iconGradient: '#493219ff',
      stats: [
        { label: 'Total Transactions', value: reportData.transactions.length },
        { label: 'Successful', value: reportData.transactions.filter(t => t.status === 'SUCCESS').length },
        { label: 'Failed', value: reportData.transactions.filter(t => t.status === 'FAILED').length },
        { label: 'Pending', value: reportData.transactions.filter(t => t.status !== 'SUCCESS' && t.status !== 'FAILED').length }
      ],
      type: 'transactions'
    },
    {
      title: 'Customers Report',
      description: 'Customer portfolio analysis and status overview',
      icon: <People />,
      iconColor: '#b78a5aff',
      iconGradient: '#493219ff',
      stats: [
        { label: 'Total Customers', value: summaryStats.activeCustomers || 0 },
        { label: 'Current Accounts', value: Math.floor((summaryStats.activeCustomers || 0) * 0.7) },
        { label: 'Warning Accounts', value: Math.floor((summaryStats.activeCustomers || 0) * 0.2) },
        { label: 'Delinquent Accounts', value: Math.floor((summaryStats.activeCustomers || 0) * 0.1) }
      ],
      type: 'customers'
    },
    {
      title: 'Collections Report',
      description: 'Daily, weekly, and monthly collection performance',
      icon: <AccountBalanceWallet />,
      iconColor: '#b78a5aff',
      iconGradient: '#493219ff',
      stats: [
        { label: 'Today\'s Collections', value: formatCurrency(summaryStats.dailyCollections) },
        { label: 'Avg. Transaction', value: formatCurrency(summaryStats.avgTransaction) },
        { label: 'Success Rate', value: formatPercentage(summaryStats.collectionRate) },
        { label: 'Portfolio Value', value: formatCurrency(summaryStats.portfolioValue) }
      ],
      type: 'collections'
    }
  ];

  // Quick stats
  const quickStats = [
    { label: 'Avg. Payment Time', value: '2.4 hrs', icon: <CalendarToday />, color: '#5c4730' },
    { label: 'Peak Collection Hour', value: '2:00 PM', icon: <ShowChart />, color: '#d4a762' },
    { label: 'Top Performing Agent', value: 'John M.', icon: <People />, color: '#55390dff' },
    { label: 'Portfolio Health', value: '94.5%', icon: <InsertChart />, color: '#a06409ff' }
  ];

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} />
      <Navbar 
        title="Reports & Analytics" 
        subtitle="Comprehensive insights and performance analytics"
        onMenuToggle={toggleSidebar}
      />
      
      {/* Main content wrapper with dynamic padding based on sidebar state */}
      <Box 
        className="reports-page-wrapper"
        sx={{
          marginLeft: sidebarCollapsed ? '65px' : '240px',
          marginTop: '60px',
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 60px)',
          width: sidebarCollapsed ? 'calc(100% - 65px)' : 'calc(100% - 240px)'
        }}
      >
        {/* Header */}
        <Box className="reports-header">
          <div className="reports-header-content">
            <Box>
              <Typography className="reports-title">
                Reports & Analytics
              </Typography>
              <Typography className="reports-subtitle">
                Comprehensive insights and performance analytics
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <button
                className="reports-action-btn"
                onClick={fetchReportsData}
                disabled={loading}
              >
                <Refresh sx={{ fontSize: 18 }} />
                Refresh
              </button>
              <button
                className="reports-primary-btn"
                onClick={() => handleGenerateReport('comprehensive')}
              >
                <Assessment sx={{ fontSize: 18 }} />
                Generate Report
              </button>
            </Box>
          </div>
        </Box>

        {/* Date Range Selector */}
        <div className="reports-date-selector">
          <div className="date-selector-label">Report Period:</div>
          
          <div className="date-range-options">
            {['today', 'yesterday', 'week', 'month', 'custom'].map((range) => (
              <button
                key={range}
                className={`date-range-btn ${dateRange === range ? 'active' : ''}`}
                onClick={() => handleDateRangeChange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          {dateRange === 'custom' && (
            <div className="custom-date-inputs">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="custom-date-input"
              />
              <span style={{ color: '#666', fontSize: '14px' }}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="custom-date-input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>

        {/* NEW: KPIs Dashboard - Using existing CSS classes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {kpiDashboard.map((kpi, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '0.75rem',
              border: '1px solid rgba(92, 71, 48, 0.1)',
              padding: '1.25rem',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: '#5c4730',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {kpi.title}
                </div>
                <div style={{ color: kpi.color, fontSize: '1.25rem', opacity: 0.9 }}>
                  {kpi.icon}
                </div>
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: kpi.color,
                marginBottom: '0.5rem',
                letterSpacing: '-0.5px'
              }}>
                {kpi.value}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#666',
                marginBottom: '0.5rem'
              }}>
                {kpi.description}
              </div>
            
            </div>
          ))}
        </div>

        {/* NEW: Search and Filters Bar - Using inline styles */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          border: '1px solid rgba(92, 71, 48, 0.1)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8f9fa',
            borderRadius: '0.5rem',
            border: '1px solid rgba(92, 71, 48, 0.1)',
            padding: '0.5rem 1rem'
          }}>
            <div style={{ marginRight: '0.75rem', opacity: 0.7 }}>
              <Search sx={{ fontSize: 18, color: '#666' }} />
            </div>
            <input
              type="text"
              placeholder="Search reports, transactions, customers..."
              style={{
                border: 'none',
                background: 'transparent',
                flex: '1',
                fontSize: '0.875rem',
                color: '#3c2a1c',
                outline: 'none'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#5c4730',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap'
            }}>
              <FilterAlt sx={{ fontSize: 16, marginRight: '6px' }} />
              Quick Filters:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid rgba(92, 71, 48, 0.2)',
                    borderRadius: '0.5rem',
                    background: activeFilters.includes(filter.id) ? '#5c4730' : 'white',
                    color: activeFilters.includes(filter.id) ? 'white' : '#5c4730',
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => toggleFilter(filter.id)}
                >
                  <span style={{ fontSize: '0.875rem' }}>{filter.icon}</span>
                  {filter.label}
                  <span style={{
                    background: activeFilters.includes(filter.id) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(92, 71, 48, 0.1)',
                    color: activeFilters.includes(filter.id) ? 'white' : '#5c4730',
                    fontSize: '0.7rem',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '1rem',
                    marginLeft: '0.25rem'
                  }}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#5c4730',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap'
            }}>
              <Sort sx={{ fontSize: 16, marginRight: '6px' }} />
              Sort by:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid rgba(92, 71, 48, 0.2)',
                    borderRadius: '0.5rem',
                    background: sortBy === option.id ? '#5c4730' : 'white',
                    color: sortBy === option.id ? 'white' : '#5c4730',
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setSortBy(option.id)}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ 
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '0.5rem',
            color: '#92400e',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="reports-loading">
            <div className="loading-spinner"></div>
            <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>
              Loading reports data...
            </Typography>
          </div>
        ) : (
          <>
            {/* Collections Chart */}
            <div className="chart-section" style={{ marginTop: '2rem' }}>
              <div className="chart-header">
                <Typography className="chart-title">
                  Collections Trend
                </Typography>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#5c4730', borderRadius: '2px' }}></div>
                    Collections (KES)
                  </span>
                </div>
              </div>
              {renderCollectionsChart()}
            </div>

            {/* Report Cards - Horizontal Layout */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              {reportCards.map((card, index) => (
                <div key={index} className="report-card" style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div className="report-card-header">
                    <div 
                      className="report-card-icon"
                      style={{ 
                        '--icon-color': card.iconColor,
                        '--icon-gradient': card.iconGradient
                      }}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <Typography className="report-card-title">
                        {card.title}
                      </Typography>
                      <Typography className="report-card-desc">
                        {card.description}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="report-card-content" style={{ flex: 1 }}>
                    <div className="report-stats">
                      {card.stats.map((stat, statIndex) => (
                        <div key={statIndex} className="report-stat-item">
                          <span className="report-stat-label">{stat.label}</span>
                          <span className="report-stat-value">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="report-card-actions">
                    <button
                      className="report-secondary-btn"
                      onClick={() => handleGenerateReport(card.type)}
                    >
                      <Assessment sx={{ fontSize: 16 }} />
                      Preview
                    </button>
                    <button
                      className="report-primary-btn"
                      onClick={() => handleGenerateReport(card.type)}
                    >
                      <Download sx={{ fontSize: 16 }} />
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats - Below Report Cards */}
            <div className="quick-stats-grid" style={{ marginTop: '2rem' }}>
              {quickStats.map((stat, index) => (
                <div key={index} className="quick-stat-card">
                  <div 
                    className="quick-stat-icon"
                    style={{ '--stat-color': stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <div className="quick-stat-value">{stat.value}</div>
                  <div className="quick-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="report-modal-overlay">
            <div className="report-modal">
              <div className="report-modal-header">
                <Typography className="report-modal-title">
                  Generate {selectedReport && selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
                </Typography>
              </div>
              
              <div className="report-modal-body">
                <Typography sx={{ color: '#666', fontSize: '0.875rem', mb: 2 }}>
                  Select export format and options for your report
                </Typography>
                
                <div className="report-options-grid">
                  <div className="report-option selected">
                    <div className="report-option-label">
                      <PictureAsPdf sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      PDF Document
                    </div>
                    <div className="report-option-desc">
                      High-quality printable document with charts and tables
                    </div>
                  </div>
                  
                  <div className="report-option">
                    <div className="report-option-label">
                      <FileCopy sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Excel Spreadsheet
                    </div>
                    <div className="report-option-desc">
                      Raw data in spreadsheet format for further analysis
                    </div>
                  </div>
                  
                  <div className="report-option">
                    <div className="report-option-label">
                      <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Email Report
                    </div>
                    <div className="report-option-desc">
                      Send report directly to your email inbox
                    </div>
                  </div>
                  
                  <div className="report-option">
                    <div className="report-option-label">
                      <BarChart sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Dashboard View
                    </div>
                    <div className="report-option-desc">
                      Interactive dashboard with filters and drill-down
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#666', mb: 1 }}>
                    Report Period: {fromDate} to {toDate}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                    Report will include: Summary statistics, detailed transactions, customer analysis, and performance metrics.
                  </Typography>
                </div>
              </div>
              
              <div className="report-modal-footer">
                <button
                  className="reports-action-btn"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedReport(null);
                  }}
                  disabled={generatingReport}
                >
                  Cancel
                </button>
                <button
                  className="reports-primary-btn"
                  onClick={() => handleExportReport('pdf')}
                  disabled={generatingReport}
                >
                  {generatingReport ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download sx={{ fontSize: 16 }} />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Box>
    </>
  );
};

export default ReportsPage;