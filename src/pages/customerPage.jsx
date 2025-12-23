// src/pages/CustomerPage.jsx - UPDATED WITH MONGODB FIXES
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh,
  Download
} from '@mui/icons-material';
import CustomerTable from '../components/common/CustomerTable';
import axios from 'axios';
import '../styles/customerpage.css';

const CustomerPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalLoanBalance: 0,
    totalArrears: 0,
    activeCustomers: 0
  });

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
      const customersResponse = await authAxios.get('/customers?limit=100');
      
      if (customersResponse.data.success) {
        // MongoDB returns data in data.customers
        const customersData = customersResponse.data.data.customers || [];
        const sortedCustomers = customersData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setCustomers(sortedCustomers);
        
        // Calculate stats from response
        if (customersResponse.data.data.summary) {
          setStats({
            totalCustomers: customersResponse.data.data.summary.totalCustomers || 0,
            totalLoanBalance: customersResponse.data.data.summary.totalLoanBalance || 0,
            totalArrears: customersResponse.data.data.summary.totalArrears || 0,
            activeCustomers: customersResponse.data.data.summary.activeCustomers || 0
          });
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setError(error.response?.data?.message || 'Failed to load customer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        {
          ...newCustomer,
          loanBalance: parseFloat(newCustomer.loanBalance) || 0,
          arrears: parseFloat(newCustomer.arrears) || 0
        },
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
        fetchData(); // Refresh the list
      } else {
        setError(response.data.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error.response?.data?.message || 'Failed to create customer. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/customers/export',
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
      
      // Get filename from headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'customers_export.csv';
      
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
      
      // Fallback: Create CSV from current data
      if (customers.length > 0) {
        exportToCSV(customers);
      } else {
        setError('Failed to export data. Please try again.');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const exportToCSV = (data) => {
    // Define CSV headers
    const headers = [
      'Customer ID',
      'Name',
      'Phone Number',
      'Email',
      'National ID',
      'Account Number',
      'Loan Balance',
      'Arrears',
      'Status',
      'Created At'
    ];
    
    // Convert data to CSV rows
    const rows = data.map(customer => [
      customer.customerId || '',
      customer.name || '',
      customer.phoneNumber || '',
      customer.email || '',
      customer.nationalId || '',
      customer.accountNumber || '',
      parseFloat(customer.loanBalance || 0).toFixed(2),
      parseFloat(customer.arrears || 0).toFixed(2),
      parseFloat(customer.arrears || 0) === 0 ? 'Current' : 
        parseFloat(customer.arrears || 0) > 1000 ? 'Delinquent' : 'Warning',
      customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const calculateTotalPortfolio = () => {
    return stats.totalLoanBalance || customers.reduce((sum, customer) => sum + parseFloat(customer.loanBalance || 0), 0);
  };

  const calculateTotalArrears = () => {
    return stats.totalArrears || customers.reduce((sum, customer) => sum + parseFloat(customer.arrears || 0), 0);
  };

  const getCurrentCustomers = () => {
    return customers.filter(c => parseFloat(c.arrears || 0) === 0).length;
  };

  const getWarningCustomers = () => {
    return customers.filter(c => parseFloat(c.arrears || 0) > 0 && parseFloat(c.arrears || 0) <= 1000).length;
  };

  const getDelinquentCustomers = () => {
    return customers.filter(c => parseFloat(c.arrears || 0) > 1000).length;
  };

  // Stats data for the cards - FIXED to use MongoDB data
  const statsData = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers || customers.length,
      icon: '👥',
      iconBg: 'linear-gradient(135deg, #d4a762, #5c4730)',
      meta: 'Active loan customers'
    },
    {
      label: 'Total Portfolio',
      value: formatCurrency(calculateTotalPortfolio()),
      icon: '💰',
      iconBg: 'linear-gradient(135deg, #27ae60, #219653)',
      meta: 'Active loan amount'
    },
    {
      label: 'Total Arrears',
      value: formatCurrency(calculateTotalArrears()),
      icon: '📈',
      iconBg: 'linear-gradient(135deg, #f39c12, #e67e22)',
      meta: 'Overdue payments'
    },
    {
      label: 'Delinquent Accounts',
      value: getDelinquentCustomers(),
      icon: '⚠️',
      iconBg: 'linear-gradient(135deg, #c0392b, #e74c3c)',
      meta: getDelinquentCustomers() > 0 ? 'Need attention' : 'All current'
    }
  ];

  return (
    <Box className="customer-page-wrapper">

      {/* Main Table Section */}
      <Box className="customer-main-content">
        <div className="customer-content-card">
          <div className="customer-section-header">
            <Box>
              <Typography className="customer-section-title">
                ALL CUSTOMERS ({customers.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <button
                className="customer-action-btn"
                onClick={fetchData}
                disabled={loading}
              >
                <Refresh sx={{ fontSize: 18 }} />
                Refresh
              </button>
              <button
                className="customer-primary-btn"
                onClick={handleExportData}
                disabled={exportLoading}
              >
                <Download sx={{ fontSize: 18 }} />
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </Box>
          </div>

          {error && (
            <Alert severity="error" sx={{
              mb: 3,
              borderRadius: '10px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca'
            }}>
              {error}
            </Alert>
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
              <Typography sx={{ color: '#666' }}>Loading customers...</Typography>
            </Box>
          ) : (
            <div className="table-container-wrapper">
              <div className="table-container">
                <CustomerTable
                  customers={customers}
                  loading={false}
                  onRefresh={fetchData}
                />
              </div>
            </div>
          )}
        </div>
      </Box>

      {/* Add Customer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#3c2a1c', fontWeight: 700 }}>
            Add New Customer
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name *"
              name="name"
              value={newCustomer.name}
              onChange={handleInputChange}
              margin="normal"
              required
              error={!newCustomer.name}
              helperText={!newCustomer.name ? "Required field" : ""}
            />
            <TextField
              fullWidth
              label="Phone Number *"
              name="phoneNumber"
              value={newCustomer.phoneNumber}
              onChange={handleInputChange}
              margin="normal"
              required
              error={!newCustomer.phoneNumber}
              helperText={!newCustomer.phoneNumber ? "Required field (254XXXXXXXXX)" : ""}
              placeholder="254712345678"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={newCustomer.email}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="National ID"
              name="nationalId"
              value={newCustomer.nationalId}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Account Number"
              name="accountNumber"
              value={newCustomer.accountNumber}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Loan Balance"
              name="loanBalance"
              value={newCustomer.loanBalance}
              onChange={handleInputChange}
              margin="normal"
              type="number"
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              fullWidth
              label="Arrears"
              name="arrears"
              value={newCustomer.arrears}
              onChange={handleInputChange}
              margin="normal"
              type="number"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <button
            className="customer-secondary-dialog-btn"
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </button>
          <button
            className="customer-primary-dialog-btn"
            onClick={handleSubmit}
            disabled={!newCustomer.name || !newCustomer.phoneNumber}
          >
            Save Customer
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerPage;