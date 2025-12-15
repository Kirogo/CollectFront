// src/pages/CustomerPage.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList,
  Download,
  Print,
  Refresh,
  PersonAdd,
  Phone,
  Email,
  AccountBalanceWallet,
  Receipt
} from '@mui/icons-material';
import CustomerTable from '../components/common/CustomerTable';
import axios from 'axios';

const CustomerPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    loanBalance: '',
    arrears: '',
    accountNumber: ''
  });

  // Fetch customers and stats
  const fetchData = async () => {
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

      // Fetch customers
      const customersResponse = await authAxios.get('/customers');
      if (customersResponse.data.success) {
        // Sort customers by createdAt date (newest first)
        const customersData = customersResponse.data.data.customers || [];
        const sortedCustomers = customersData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // Newest first
        });
        setCustomers(sortedCustomers);
      } else {
        setError('Failed to load customers');
      }

      // Fetch stats
      const statsResponse = await authAxios.get('/customers/dashboard/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.stats);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      setError('Failed to load customer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle new customer form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/customers',
        newCustomer,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOpenDialog(false);
        setNewCustomer({
          name: '',
          phoneNumber: '',
          email: '',
          nationalId: '',
          loanBalance: '',
          arrears: '',
          accountNumber: ''
        });
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Failed to create customer. Please try again.');
    }
  };

  // Table actions
  const handleViewCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleEditCustomer = (customer) => {
    // Navigate to edit customer page
    console.log('Edit customer:', customer);
  };

  const formatCurrency = (amount) => {
    return `KES ${parseFloat(amount || 0).toLocaleString('en-KE')}`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#5c4730' }}>
            Customer Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchData}
              sx={{ 
                borderColor: '#e8e8e8',
                color: '#5c4730',
                '&:hover': { borderColor: '#d4a762' }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{ 
                borderColor: '#e8e8e8',
                color: '#5c4730',
                '&:hover': { borderColor: '#d4a762' }
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                backgroundColor: '#5c4730',
                '&:hover': { backgroundColor: '#3c2a1c' }
              }}
            >
              Add Customer
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Manage your loan customers, view details, and track repayments
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              backgroundColor: '#F5F0EA',
              border: '1px solid #e8e8e8',
              borderRadius: 3,
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <PersonAdd sx={{ color: '#5c4730', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#5c4730' }}>
                      {stats.totalCustomers?.toLocaleString() || customers.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Total Customers
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#27ae60', fontWeight: 500 }}>
                  Showing {customers.length} customers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              backgroundColor: '#F2EDE9',
              border: '1px solid #e8e8e8',
              borderRadius: 3,
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <AccountBalanceWallet sx={{ color: '#3c2a1c', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#3c2a1c' }}>
                      {formatCurrency(stats.totalLoanPortfolio || customers.reduce((sum, c) => sum + parseFloat(c.loanBalance || 0), 0))}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Loan Portfolio
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#27ae60', fontWeight: 500 }}>
                  Average: {formatCurrency(customers.length > 0 ? customers.reduce((sum, c) => sum + parseFloat(c.loanBalance || 0), 0) / customers.length : 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              backgroundColor: '#FAF6F0',
              border: '1px solid #e8e8e8',
              borderRadius: 3,
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Receipt sx={{ color: '#f39c12', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f39c12' }}>
                      {formatCurrency(stats.totalArrears || customers.reduce((sum, c) => sum + parseFloat(c.arrears || 0), 0))}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Total Arrears
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#c0392b', fontWeight: 500 }}>
                  {customers.filter(c => parseFloat(c.arrears || 0) > 0).length} customers with arrears
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              backgroundColor: '#ECFDF5',
              border: '1px solid #e8e8e8',
              borderRadius: 3,
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography sx={{ fontSize: 32 }}>📊</Typography>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#27ae60' }}>
                      {customers.length > 0 ? Math.round((customers.filter(c => c.isActive).length / customers.length) * 100) : 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Active Rate
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#27ae60', fontWeight: 500 }}>
                  {customers.filter(c => c.isActive).length} active customers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Customer Table */}
      <Box sx={{ mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography>Loading customers...</Typography>
          </Paper>
        ) : (
          <CustomerTable
            customers={customers}
            loading={false}
            onView={handleViewCustomer}
            onEdit={handleEditCustomer}
          />
        )}
      </Box>

      {/* Customer Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3,
            border: '1px solid #e8e8e8',
            boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730', mb: 3 }}>
              Customer Status Distribution
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Current (No Arrears)', count: customers.filter(c => parseFloat(c.arrears || 0) === 0).length, color: '#27ae60', percentage: customers.length > 0 ? (customers.filter(c => parseFloat(c.arrears || 0) === 0).length / customers.length * 100).toFixed(1) : 0 },
                { label: 'Warning (≤ KES 1,000)', count: customers.filter(c => parseFloat(c.arrears || 0) > 0 && parseFloat(c.arrears || 0) <= 1000).length, color: '#f39c12', percentage: customers.length > 0 ? (customers.filter(c => parseFloat(c.arrears || 0) > 0 && parseFloat(c.arrears || 0) <= 1000).length / customers.length * 100).toFixed(1) : 0 },
                { label: 'Delinquent (> KES 1,000)', count: customers.filter(c => parseFloat(c.arrears || 0) > 1000).length, color: '#c0392b', percentage: customers.length > 0 ? (customers.filter(c => parseFloat(c.arrears || 0) > 1000).length / customers.length * 100).toFixed(1) : 0 }
              ].map((item, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#5c4730', fontWeight: 500 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: item.color, fontWeight: 600 }}>
                      {item.count} ({item.percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(item.percentage)} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: `${item.color}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.color,
                        borderRadius: 4
                      }
                    }} 
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3,
            border: '1px solid #e8e8e8',
            boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730', mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Send Bulk SMS', icon: '📱', color: '#5c4730', onClick: () => console.log('Send SMS') },
                { label: 'Generate Report', icon: '📊', color: '#d4a762', onClick: () => console.log('Generate Report') },
                { label: 'Import Customers', icon: '📥', color: '#3c2a1c', onClick: () => console.log('Import Customers') },
                { label: 'View Analytics', icon: '📈', color: '#27ae60', onClick: () => console.log('View Analytics') }
              ].map((action, index) => (
                <Grid item xs={6} key={index}>
                  <Button
                    fullWidth
                    onClick={action.onClick}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      color: action.color,
                      border: '1px solid #e8e8e8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f0ea',
                        borderColor: action.color,
                        transform: 'translateY(-2px)'
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

      {/* Add Customer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#5c4730', fontWeight: 600 }}>
          Add New Customer
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Full Name"
              name="name"
              value={newCustomer.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={newCustomer.phoneNumber}
              onChange={handleInputChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>+254</Typography>
              }}
            />
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={newCustomer.email}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="National ID"
              name="nationalId"
              value={newCustomer.nationalId}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Initial Loan Balance (KES)"
              name="loanBalance"
              type="number"
              value={newCustomer.loanBalance}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Initial Arrears (KES)"
              name="arrears"
              type="number"
              value={newCustomer.arrears}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Account Number"
              name="accountNumber"
              value={newCustomer.accountNumber}
              onChange={handleInputChange}
              fullWidth
              helperText="Leave blank to auto-generate"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#666' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#5c4730',
              '&:hover': { backgroundColor: '#3c2a1c' }
            }}
          >
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerPage;