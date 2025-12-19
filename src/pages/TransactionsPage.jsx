// src/pages/TransactionsPage.jsx - UPDATED WITH MATCHING STYLE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress
} from '@mui/material';
import {
  Search,
  Download,
  Refresh,
  TrendingUp,
  Receipt,
  AccountBalanceWallet,
  Payment,
  CheckCircle,
  Cancel,
  AccessTime,
  HourglassEmpty
} from '@mui/icons-material';
import axios from 'axios';
import '../styles/transactionspage.css';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/payments/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        
        // Calculate stats from transactions
        const totalAmount = response.data.data.transactions?.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;
        const successful = response.data.data.transactions?.filter(t => t.status?.toUpperCase() === 'SUCCESS').length || 0;
        const failed = response.data.data.transactions?.filter(t => t.status?.toUpperCase() === 'FAILED').length || 0;
        const pending = response.data.data.transactions?.filter(t => !['SUCCESS', 'FAILED'].includes(t.status?.toUpperCase())).length || 0;
        
        setStats({
          totalTransactions: response.data.data.transactions?.length || 0,
          successfulTransactions: successful,
          failedTransactions: failed,
          pendingTransactions: pending,
          totalAmount: totalAmount,
          averageTransaction: totalAmount / (response.data.data.transactions?.length || 1),
          successRate: response.data.data.transactions?.length ? (successful / response.data.data.transactions.length) * 100 : 0
        });
      } else {
        setError('Failed to load transactions data');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction =>
    transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.phoneNumber?.includes(searchTerm) ||
    transaction.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  // Format large numbers
  const formatNumber = (num) => {
    return num.toLocaleString('en-KE');
  };

  // Get status props
  const getStatusProps = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
        return { 
          text: 'Success', 
          class: 'success', 
          icon: <CheckCircle sx={{ fontSize: 14 }} />
        };
      case 'FAILED':
        return { 
          text: 'Failed', 
          class: 'failed', 
          icon: <Cancel sx={{ fontSize: 14 }} />
        };
      default:
        return { 
          text: 'Pending', 
          class: 'pending', 
          icon: <AccessTime sx={{ fontSize: 14 }} />
        };
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/transactions/export',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'transactions_export.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Stats data
  const statsData = [
    {
      label: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      icon: <Receipt />,
      iconBg: 'linear-gradient(135deg, #5c4730, #3c2a1c)',
      meta: 'All time transactions'
    },
    {
      label: 'Total Amount',
      value: formatCurrency(stats?.totalAmount || 0),
      icon: <AccountBalanceWallet />,
      iconBg: 'linear-gradient(135deg, #5c4730, #3c2a1c)',
      meta: 'Total value processed'
    },
    {
      label: 'Successfull',
      value: stats?.successfulTransactions || 0,
      icon: <CheckCircle />,
      iconBg: 'linear-gradient(135deg, #5c4730, #3c2a1c)',
      meta: 'Completed payments'
    },
    {
      label: 'Pending',
      value: stats?.pendingTransactions || 0,
      icon: <HourglassEmpty />,
      iconBg: 'linear-gradient(135deg, #5c4730, #3c2a1c)',
      meta: 'Pending payments'
    }
  ];

  return (
    <Box className="transactions-page-wrapper">
      {/* Header */}
      <Box className="transactions-header">
        <div className="transactions-header-content">
          <Box>
            <Typography className="transactions-title">
              Transaction History
            </Typography>
            <Typography className="transactions-subtitle">
              View and manage all payment transactions
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <button
              className="transactions-action-btn"
              onClick={fetchTransactions}
              disabled={loading}
            >
              <Refresh sx={{ fontSize: 18 }} />
              Refresh
            </button>
            <button
              className="transactions-primary-btn"
              onClick={handleExportData}
              disabled={exportLoading}
            >
              <Download sx={{ fontSize: 18 }} />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </Box>
        </div>
      </Box>

      {/* Stats Grid */}
      <div className="transactions-stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className="transactions-stat-card">
            <div className="transactions-stat-header">
              <div className="transactions-stat-label">{stat.label}</div>
              <div 
                className="transactions-stat-icon-wrapper"
                style={{ background: stat.iconBg }}
              >
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="transactions-stat-value">
                {stat.value}
              </div>
              <div className="transactions-stat-meta">
                {stat.meta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Box className="transactions-main-content">
        <div className="transactions-content-card">
          <div className="transactions-section-header">
            <Box>
              <Typography className="transactions-section-title">
                TRANSACTION LIST
              </Typography>
            </Box>
            
            <div className="transactions-search-container">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="transactions-search-input"
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <LinearProgress sx={{
                mb: 2,
                borderRadius: '4px',
                backgroundColor: '#f5f0ea',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#5c4730'
                }
              }} />
              <Typography sx={{ color: '#666' }}>Loading transactions...</Typography>
            </Box>
          ) : (
            <>
              <div className="transactions-table-container-wrapper">
                <div className="transactions-table-container">
                  {filteredTransactions.length === 0 ? (
                    <div className="transactions-empty-state">
                      <div className="transactions-empty-icon">📊</div>
                      <Typography className="transactions-empty-title">
                        {searchTerm ? 'No transactions found' : 'No transactions available'}
                      </Typography>
                      <Typography className="transactions-empty-subtitle">
                        {searchTerm ? 'Try a different search term' : 'Transactions will appear here'}
                      </Typography>
                    </div>
                  ) : (
                    <table className="transactions-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Customer</th>
                          <th>Phone</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTransactions.map((transaction) => {
                          const statusProps = getStatusProps(transaction.status);
                          return (
                            <tr 
                              key={transaction.id}
                              onClick={() => {
                                // Optional: Add click handler for transaction details
                                // navigate(`/transactions/${transaction.id}`)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <td style={{ fontFamily: 'monospace', fontWeight: '600', color: '#5c4730' }}>
                                {transaction.transactionId?.slice(0, 10)}...
                              </td>
                              <td>
                                {transaction.customerName || 'N/A'}
                              </td>
                              <td>
                                {transaction.phoneNumber || 'N/A'}
                              </td>
                              <td style={{ fontWeight: '700', color: '#3c2a1c' }}>
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td>
                                <span className={`transactions-status-chip ${statusProps.class}`}>
                                  {statusProps.icon}
                                  {statusProps.text}
                                </span>
                              </td>
                              <td>
                                {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-KE', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#666' }}>
                                {transaction.referenceCode?.slice(0, 12)}...
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {filteredTransactions.length > 0 && (
                <div className="transactions-pagination">
                  <div className="transactions-pagination-info">
                    Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </div>
                  
                  <div className="transactions-pagination-controls">
                    <button
                      className="transactions-pagination-btn"
                      onClick={() => handleChangePage(page - 1)}
                      disabled={page === 0}
                    >
                      Previous
                    </button>
                    
                    <select
                      value={rowsPerPage}
                      onChange={handleChangeRowsPerPage}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: '1px solid rgba(92, 71, 48, 0.2)',
                        borderRadius: '0.375rem',
                        background: 'white',
                        color: '#5c4730',
                        fontSize: '0.8125rem',
                        fontWeight: '600'
                      }}
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="25">25 per page</option>
                    </select>
                    
                    <button
                      className="transactions-pagination-btn"
                      onClick={() => handleChangePage(page + 1)}
                      disabled={(page + 1) * rowsPerPage >= filteredTransactions.length}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default TransactionsPage;