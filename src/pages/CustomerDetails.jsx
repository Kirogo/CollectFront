// src/pages/CustomerDetails.jsx - REDESIGNED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Phone,
  Person,
  Email,
  AccountBalanceWallet,
  Receipt,
  Payment,
  AccountCircle,
  CalendarToday,
  Edit,
  CheckCircle,
  Error as ErrorIcon,
  Badge,
  CreditCard,
  MonetizationOn,
  Schedule,
  Lock
} from '@mui/icons-material';
import axios from 'axios';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [initiating, setInitiating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [mpesaPin, setMpesaPin] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const authAxios = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const response = await authAxios.get(`/customers/${id}`);
      
      if (response.data.success) {
        const customerData = response.data.data.customer;
        setCustomer(customerData);
        setPhoneNumber(customerData.phoneNumber);
      } else {
        setError('Customer not found');
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      if (error.response?.status === 404) {
        setError('Customer not found');
      } else {
        setError('Failed to load customer details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  // Format currency
  const formatCurrency = (amount) => {
    return `KES ${parseFloat(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (arrears) => {
    if (parseFloat(arrears) === 0) return 'success';
    if (parseFloat(arrears) > 0 && parseFloat(arrears) <= 1000) return 'warning';
    return 'error';
  };

  // Get status text
  const getStatusText = (arrears) => {
    if (parseFloat(arrears) === 0) return 'Current';
    if (parseFloat(arrears) > 0 && parseFloat(arrears) <= 1000) return 'Warning';
    return 'Delinquent';
  };

  // Initiate STK Push
  const initiateSTKPush = async () => {
    try {
      setInitiating(true);
      setPaymentStatus(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/payments/stk-push',
        {
          phoneNumber,
          amount: customer.arrears,
          customerId: customer.id,
          customerName: customer.name,
          accountNumber: customer.accountNumber
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPaymentStatus({
          type: 'info',
          message: 'Payment request sent! Please check your phone for the STK Push prompt.',
          transactionId: response.data.data.transactionId
        });
        setShowPinDialog(true);
      } else {
        setPaymentStatus({
          type: 'error',
          message: response.data.message || 'Failed to initiate payment'
        });
      }
    } catch (error) {
      console.error('Error initiating STK Push:', error);
      setPaymentStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to initiate payment. Please try again.'
      });
    } finally {
      setInitiating(false);
    }
  };

  // Process PIN
  const processPin = async () => {
    try {
      setProcessingPayment(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/payments/process-pin',
        {
          transactionId: paymentStatus.transactionId,
          pin: mpesaPin
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPaymentStatus({
          type: 'success',
          message: 'Payment processed successfully!',
          details: response.data.data
        });
        setShowPinDialog(false);
        setMpesaPin('');
        
        // Refresh customer data
        setTimeout(() => {
          fetchCustomerDetails();
        }, 2000);
      } else {
        setPaymentStatus({
          type: 'error',
          message: response.data.message || 'Payment processing failed'
        });
      }
    } catch (error) {
      console.error('Error processing PIN:', error);
      setPaymentStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to process payment. Please try again.'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading customer details...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          sx={{ color: '#5c4730' }}
        >
          Back to Customers
        </Button>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning">
          Customer not found
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2, color: '#5c4730' }}
        >
          Back to Customers
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          sx={{ mb: 2, color: '#5c4730' }}
        >
          Back to Customers
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#5c4730', mb: 1 }}>
              {customer.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<Badge />}
                label={`ID: ${customer.customerId}`}
                size="small"
                sx={{ backgroundColor: '#f5f0ea', color: '#5c4730', fontWeight: 500 }}
              />
              <Chip
                icon={<AccountCircle />}
                label={`Account: ${customer.accountNumber}`}
                size="small"
                sx={{ backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 500 }}
              />
              <Chip
                label={getStatusText(customer.arrears)}
                color={getStatusColor(customer.arrears)}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
              <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Member since: {formatDate(customer.createdAt)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
              Created by: {customer.createdBy || 'System'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Payment Status Alert */}
      {paymentStatus && (
        <Alert 
          severity={paymentStatus.type} 
          sx={{ mb: 3 }}
          icon={paymentStatus.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
        >
          <AlertTitle>
            {paymentStatus.type === 'success' ? 'Success' : 
             paymentStatus.type === 'error' ? 'Error' : 'Info'}
          </AlertTitle>
          {paymentStatus.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Customer Information */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Personal Information Card */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 3,
                border: '1px solid #e8e8e8',
                boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Person sx={{ color: '#5c4730', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730' }}>
                    Personal Information
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
                        Full Name
                      </Typography>
                      <TextField
                        value={customer.name}
                        fullWidth
                        disabled
                        size="small"
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            color: '#5c4730',
                            fontWeight: 500,
                            fontSize: '16px'
                          },
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f8f9fa'
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
                        Email Address
                      </Typography>
                      <TextField
                        value={customer.email || 'Not provided'}
                        fullWidth
                        disabled
                        size="small"
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            color: customer.email ? '#5c4730' : '#999',
                            fontStyle: customer.email ? 'normal' : 'italic'
                          },
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f8f9fa'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
                        National ID
                      </Typography>
                      <TextField
                        value={customer.nationalId || 'Not provided'}
                        fullWidth
                        disabled
                        size="small"
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            color: customer.nationalId ? '#5c4730' : '#999',
                            fontStyle: customer.nationalId ? 'normal' : 'italic'
                          },
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f8f9fa'
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
                        Customer ID
                      </Typography>
                      <TextField
                        value={customer.customerId}
                        fullWidth
                        disabled
                        size="small"
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            color: '#5c4730',
                            fontWeight: 500,
                            fontSize: '16px'
                          },
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f8f9fa'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Loan Information Card */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 3,
                border: '1px solid #e8e8e8',
                boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <AccountBalanceWallet sx={{ color: '#5c4730', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730' }}>
                    Loan Details
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      backgroundColor: '#f5f0ea',
                      border: '1px solid #e8e8e8',
                      borderRadius: 2,
                      height: '100%'
                    }}>
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <MonetizationOn sx={{ color: '#5c4730', fontSize: 32, mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#5c4730', mb: 1 }}>
                          {formatCurrency(customer.loanBalance)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Loan Balance
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      backgroundColor: parseFloat(customer.arrears) > 0 ? '#fef2f2' : '#ecfdf5',
                      border: `1px solid ${parseFloat(customer.arrears) > 0 ? '#fecaca' : '#a7f3d0'}`,
                      borderRadius: 2,
                      height: '100%'
                    }}>
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Receipt sx={{ 
                          color: parseFloat(customer.arrears) > 0 ? '#dc2626' : '#059669', 
                          fontSize: 32, 
                          mb: 1 
                        }} />
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700, 
                          color: parseFloat(customer.arrears) > 0 ? '#dc2626' : '#059669',
                          mb: 1 
                        }}>
                          {formatCurrency(customer.arrears)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Arrears Amount
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      backgroundColor: '#fef9e7',
                      border: '1px solid #fde68a',
                      borderRadius: 2,
                      height: '100%'
                    }}>
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <CreditCard sx={{ color: '#d97706', fontSize: 32, mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#d97706', mb: 1 }}>
                          {formatCurrency(customer.totalRepayments || 0)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Total Repayments
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 2,
                      height: '100%'
                    }}>
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Schedule sx={{ color: '#3b82f6', fontSize: 32, mb: 1 }} />
                        <Typography variant="body2" sx={{ 
                          color: customer.lastPaymentDate ? '#3b82f6' : '#666',
                          fontWeight: customer.lastPaymentDate ? 600 : 400,
                          mb: 1 
                        }}>
                          {customer.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'No payments yet'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Last Payment
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column: Payment & Contact Information */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Payment Card */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e8e8e8',
              boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Payment sx={{ color: '#5c4730', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730' }}>
                  MPesa Payment
                </Typography>
              </Box>
              
              {/* Payment Amount */}
              <Box sx={{ 
                backgroundColor: parseFloat(customer.arrears) > 0 ? '#fef2f2' : '#f0fdf4',
                border: `2px solid ${parseFloat(customer.arrears) > 0 ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: 2,
                p: 3,
                mb: 3,
                textAlign: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                  Amount to Clear
                </Typography>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  color: parseFloat(customer.arrears) > 0 ? '#dc2626' : '#059669',
                  mb: 2 
                }}>
                  {formatCurrency(customer.arrears)}
                </Typography>
                
                {parseFloat(customer.arrears) === 0 ? (
                  <Chip
                    label="No arrears - Account is current"
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                ) : (
                  <Chip
                    label={`Status: ${getStatusText(customer.arrears)}`}
                    color={getStatusColor(customer.arrears)}
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
              
              {/* Phone Number Input */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#666', mb: 2, fontWeight: 500 }}>
                  <Phone sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                  Payment Phone Number
                </Typography>
                <TextField
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  fullWidth
                  size="medium"
                  placeholder="2547XXXXXXXX"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: 2
                    }
                  }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: '#666', fontWeight: 500 }}>+</Typography>,
                  }}
                />
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                  Confirm or update the MPesa registered phone number
                </Typography>
              </Box>
              
              {/* Payment Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={initiating ? <CircularProgress size={20} color="inherit" /> : <Payment />}
                onClick={initiateSTKPush}
                disabled={initiating || parseFloat(customer.arrears) === 0 || !phoneNumber || phoneNumber.length < 10}
                sx={{
                  backgroundColor: '#5c4730',
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '16px',
                  fontWeight: 600,
                  '&:hover': { 
                    backgroundColor: '#3c2a1c',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(92, 71, 48, 0.2)'
                  },
                  '&:disabled': { 
                    backgroundColor: '#cccccc',
                    color: '#666'
                  },
                  transition: 'all 0.3s'
                }}
              >
                {initiating ? 'Sending Request...' : 
                 parseFloat(customer.arrears) === 0 ? 'No Arrears to Pay' : 
                 'Send MPesa Payment Request'}
              </Button>
              
              {/* Payment Instructions */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e8e8e8' }}>
                <Typography variant="subtitle2" sx={{ color: '#5c4730', mb: 1, fontWeight: 600 }}>
                  Payment Instructions:
                </Typography>
                <Box component="ol" sx={{ pl: 2, m: 0, color: '#666', fontSize: '14px' }}>
                  <li>Confirm phone number is correct</li>
                  <li>Click "Send MPesa Payment Request"</li>
                  <li>Check your phone for MPesa prompt</li>
                  <li>Enter your MPesa PIN when prompted</li>
                  <li>Wait for payment confirmation</li>
                </Box>
              </Box>
            </Paper>

            {/* Account Information Card */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e8e8e8',
              boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <AccountCircle sx={{ color: '#5c4730', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730' }}>
                  Account Information
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
                    Account Number
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#5c4730', fontWeight: 500 }}>
                    {customer.accountNumber}
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
                    Account Status
                  </Typography>
                  <Chip
                    label={customer.isActive ? 'Active' : 'Inactive'}
                    color={customer.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {formatDateTime(customer.updatedAt || customer.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* MPesa PIN Dialog */}
      <Dialog 
        open={showPinDialog} 
        onClose={() => !processingPayment && setShowPinDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          color: '#5c4730', 
          fontWeight: 600,
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <Lock sx={{ verticalAlign: 'middle', mr: 1 }} />
          Enter MPesa PIN
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Check your phone for the MPesa STK Push prompt. Then enter your MPesa PIN below to complete the payment.
          </Alert>
          
          <TextField
            label="MPesa PIN"
            type="password"
            value={mpesaPin}
            onChange={(e) => setMpesaPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            fullWidth
            placeholder="Enter 4-digit PIN"
            inputProps={{ maxLength: 4 }}
            disabled={processingPayment}
            sx={{ 
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          
          <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 2 }}>
            Enter the same PIN you use on your phone for MPesa transactions
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, borderTop: '1px solid #e8e8e8' }}>
          <Button 
            onClick={() => {
              setShowPinDialog(false);
              setMpesaPin('');
            }}
            disabled={processingPayment}
            sx={{ 
              color: '#666',
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={processPin}
            variant="contained"
            disabled={processingPayment || mpesaPin.length !== 4}
            sx={{
              backgroundColor: '#5c4730',
              borderRadius: 2,
              px: 3,
              '&:hover': { backgroundColor: '#3c2a1c' },
              '&:disabled': { backgroundColor: '#cccccc' }
            }}
          >
            {processingPayment ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Processing...
              </>
            ) : (
              'Complete Payment'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerDetails;