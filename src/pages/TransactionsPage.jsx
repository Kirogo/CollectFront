// src/pages/TransactionsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  TablePagination,
  Card,
  CardContent
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  AccessTime
} from '@mui/icons-material';
import axios from 'axios';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Performance metrics (moved from dashboard)
  const performanceMetrics = [
    { label: 'Collection Rate', value: 94.5, target: 95, color: '#27ae60' },
    { label: 'Customer Satisfaction', value: 88.2, target: 90, color: '#5c4730' },
    { label: 'On-time Payments', value: 91.8, target: 92, color: '#d4a762' },
    { label: 'Portfolio Quality', value: 96.3, target: 95, color: '#3c2a1c' }
  ];

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/payments/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // Set sample stats for now
    setStats({
      totalTransactions: 1250,
      successfulTransactions: 1180,
      failedTransactions: 70,
      totalAmount: 12500000,
      averageTransaction: 10000,
      successRate: 94.4
    });
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction =>
    transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.phoneNumber?.includes(searchTerm)
  );

  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `KES ${parseFloat(amount || 0).toLocaleString('en-KE')}`;
  };

  // Get status icon and color
  const getStatusProps = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return { icon: <CheckCircle />, color: '#27ae60', bgcolor: '#ecfdf5' };
      case 'FAILED':
        return { icon: <Cancel />, color: '#c0392b', bgcolor: '#fef2f2' };
      default:
        return { icon: <AccessTime />, color: '#f39c12', bgcolor: '#fffbeb' };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#5c4730' }}>
            Transaction History
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton sx={{ 
              border: '1px solid #e8e8e8',
              borderRadius: 2,
              backgroundColor: 'white'
            }}>
              <Download />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ color: '#666' }}>
          View and manage all payment transactions
        </Typography>
      </Box>

      {/* Performance Summary Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 3,
        border: '1px solid #e8e8e8',
        boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730', mb: 3 }}>
          Performance Summary
        </Typography>
        
        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {[
                { label: 'Total Transactions', value: stats?.totalTransactions || 0, icon: '📊', color: '#5c4730' },
                { label: 'Successful', value: stats?.successfulTransactions || 0, icon: '✅', color: '#27ae60' },
                { label: 'Failed', value: stats?.failedTransactions || 0, icon: '❌', color: '#c0392b' },
                { label: 'Total Amount', value: formatCurrency(stats?.totalAmount || 0), icon: '💰', color: '#d4a762' }
              ].map((stat, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Card sx={{ 
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e8e8e8',
                    borderRadius: 2,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color, mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <Paper sx={{ 
        borderRadius: 3, 
        border: '1px solid #e8e8e8',
        boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid #e8e8e8',
          backgroundColor: '#f8f9fa'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730' }}>
              Recent Transactions ({filteredTransactions.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ 
                  width: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton sx={{ 
                border: '1px solid #e8e8e8',
                borderRadius: 2,
                backgroundColor: 'white'
              }}>
                <FilterList />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f0ea' }}>
                <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>Transaction ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <LinearProgress sx={{ width: '50%', mx: 'auto' }} />
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm ? 'No transactions found' : 'No transactions available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => {
                  const statusProps = getStatusProps(transaction.status);
                  return (
                    <TableRow 
                      key={transaction.id}
                      hover
                      sx={{ 
                        '&:hover': { backgroundColor: '#faf6f0' },
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      <TableCell sx={{ color: '#5c4730', fontWeight: 500 }}>
                        {transaction.transactionId?.slice(0, 8)}...
                      </TableCell>
                      <TableCell sx={{ color: '#5c4730' }}>
                        {transaction.customerName || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: '#666' }}>
                        {transaction.phoneNumber}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#5c4730' }}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusProps.icon}
                          label={transaction.status || 'PENDING'}
                          size="small"
                          sx={{
                            backgroundColor: statusProps.bgcolor,
                            color: statusProps.color,
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#666' }}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: '#666', fontFamily: 'monospace' }}>
                        {transaction.referenceCode?.slice(0, 10)}...
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e8e8e8',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: '#666'
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default TransactionsPage;