// src/pages/TransactionsPage.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress,
  Modal,
  IconButton
} from '@mui/material';
import {
  Download,
  Refresh,
  Receipt,
  AccountBalanceWallet,
  CheckCircle,
  Cancel,
  AccessTime,
  HourglassEmpty,
  Close,
  Person,
  Phone,
  CalendarToday,
  Payment,
  ReceiptLong,
  CreditCard,
  AccountBalance,
  Money,
  TrendingDown,
  DoneAll,
  Warning
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
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    phoneNumber: '',
    alternativePhoneNumber: '',
    amount: '',
    useAlternativeNumber: false
  });
  const [mpesaStatus, setMpesaStatus] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Store customer details for accurate loan balance
  const [customerDetails, setCustomerDetails] = useState(null);

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
        const transactionsData = response.data.data?.transactions || [];
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);

        // Calculate stats
        const totalAmount = transactionsData.reduce((sum, t) => sum + parseFloat(t?.amount || 0), 0);
        const successful = transactionsData.filter(t => t?.status?.toUpperCase() === 'SUCCESS').length;
        const failed = transactionsData.filter(t => t?.status?.toUpperCase() === 'FAILED').length;
        const pending = transactionsData.filter(t => t?.status?.toUpperCase() === 'PENDING').length;
        const expired = transactionsData.filter(t => t?.status?.toUpperCase() === 'EXPIRED').length;
        const cancelled = transactionsData.filter(t => t?.status?.toUpperCase() === 'CANCELLED').length;

        setStats({
          totalTransactions: transactionsData.length || 0,
          successfulTransactions: successful,
          failedTransactions: failed,
          pendingTransactions: pending,
          expiredTransactions: expired,
          cancelledTransactions: cancelled,
          totalAmount: totalAmount,
          averageTransaction: transactionsData.length > 0 ? totalAmount / transactionsData.length : 0,
          successRate: transactionsData.length > 0 ? (successful / transactionsData.length) * 100 : 0
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

      setError(error.response?.data?.message || 'Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details for accurate loan balance
  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('Customer details fetched:', response.data.data.customer);
        return response.data.data.customer;
      }
      return null;
    } catch (error) {
      console.error('Error fetching customer details:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm ||
      (transaction.customerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.phoneNumber || '').includes(searchTerm);

    const matchesStatus = !statusFilter ||
      (transaction.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

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
      case 'PENDING':
        return {
          text: 'Pending',
          class: 'pending',
          icon: <AccessTime sx={{ fontSize: 14 }} />
        };
      case 'EXPIRED':
        return {
          text: 'Expired',
          class: 'expired',
          icon: <HourglassEmpty sx={{ fontSize: 14 }} />
        };
      case 'CANCELLED':
        return {
          text: 'Cancelled',
          class: 'cancelled',
          icon: <Cancel sx={{ fontSize: 14, color: '#6b7280' }} />
        };
      default:
        return {
          text: status || 'Unknown',
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

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

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

  // Handle transaction click - FIXED
  const handleTransactionClick = async (transaction) => {
    setSelectedTransaction(transaction);

    // Debug logging
    console.log('Transaction clicked:', {
      transaction,
      customerId: transaction.customerId,
      customerName: transaction.customerId?.name,
      customerDataStructure: JSON.stringify(transaction.customerId, null, 2)
    });

    // Fetch the latest customer details for accurate loan balance
    if (transaction.customerId?._id || transaction.customerId) {
      const customerId = transaction.customerId._id || transaction.customerId;
      const details = await fetchCustomerDetails(customerId);
      setCustomerDetails(details);
      console.log('Customer details fetched:', details);
    } else {
      setCustomerDetails(null);
    }

    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTransaction(null);
    setCustomerDetails(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Format date for modal
  const formatDetailedDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Calculate loan details based on actual customer data
  const calculateLoanDetails = (transaction) => {
    // Use customerDetails if available, otherwise fall back to transaction data
    const currentCustomerData = customerDetails || transaction.customerId;

    const transactionAmount = parseFloat(transaction.amount || 0);
    const totalLoanBalance = parseFloat(currentCustomerData?.loanBalance || 0);
    const arrearsAmount = parseFloat(currentCustomerData?.arrears || currentCustomerData?.arrearsBalance || 0);
    const totalRepayments = parseFloat(currentCustomerData?.totalRepayments || 0);

    // For successful transactions, calculate cleared arrears and remaining balances
    if (transaction.status?.toUpperCase() === 'SUCCESS') {
      // Assume transaction clears arrears first, then principal
      const arrearsCleared = Math.min(transactionAmount, arrearsAmount);
      const principalPaid = Math.max(0, transactionAmount - arrearsCleared);
      const remainingArrears = Math.max(0, arrearsAmount - arrearsCleared);
      const remainingPrincipal = Math.max(0, totalLoanBalance - arrearsAmount - principalPaid);
      const newLoanBalance = remainingArrears + remainingPrincipal;
      const totalCleared = arrearsCleared + principalPaid;

      return {
        transactionAmount,
        totalLoanBalance,
        arrearsAmount,
        arrearsCleared,
        principalPaid,
        remainingArrears,
        remainingPrincipal,
        newLoanBalance,
        totalCleared,
        totalRepayments,
        isPaidOff: newLoanBalance <= 0,
        hasArrears: remainingArrears > 0
      };
    } else {
      // For non-successful transactions, show current state
      return {
        transactionAmount,
        totalLoanBalance,
        arrearsAmount,
        arrearsCleared: 0,
        principalPaid: 0,
        remainingArrears: arrearsAmount,
        remainingPrincipal: Math.max(0, totalLoanBalance - arrearsAmount),
        newLoanBalance: totalLoanBalance,
        totalCleared: 0,
        totalRepayments,
        isPaidOff: false,
        hasArrears: arrearsAmount > 0
      };
    }
  };

  // handleRetryPayment function - FIXED
  // handleRetryPayment function - FINAL FIX
  const handleRetryPayment = async () => {
    if (!selectedTransaction) return;

    try {
      setProcessingPayment(true);

      console.log('=== RETRY PAYMENT DEBUG ===');
      console.log('Selected Transaction:', selectedTransaction);
      console.log('Customer ID from transaction:', selectedTransaction.customerId);
      console.log('Customer Details state:', customerDetails);

      // Extract customer ID from transaction
      let customerId = null;
      if (typeof selectedTransaction.customerId === 'string') {
        customerId = selectedTransaction.customerId;
      } else if (selectedTransaction.customerId?._id) {
        customerId = selectedTransaction.customerId._id;
      }

      console.log('Extracted Customer ID:', customerId);

      // Try to get customer data from state first, then fetch if needed
      let currentCustomerData = customerDetails;

      if (!currentCustomerData && customerId) {
        console.log('Fetching customer details for ID:', customerId);
        currentCustomerData = await fetchCustomerDetails(customerId);

        if (currentCustomerData) {
          setCustomerDetails(currentCustomerData);
          console.log('Customer details fetched:', currentCustomerData);
        }
      }

      // Set payment data
      setPaymentData({
        phoneNumber: currentCustomerData?.phoneNumber ||
          selectedTransaction.phoneNumber ||
          selectedTransaction.customerId?.phoneNumber ||
          '',
        alternativePhoneNumber: '',
        amount: currentCustomerData?.arrears ||
          selectedTransaction.amount ||
          '',
        useAlternativeNumber: false
      });

      console.log('Payment Data set:', {
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        currentCustomerData
      });

      // Close the transaction modal and open payment modal
      setModalOpen(false);
      setShowPaymentModal(true);
      setMpesaStatus(null);

    } catch (error) {
      console.error('Error preparing payment:', error);
      setError(`Failed to load customer details for payment: ${error.message}`);

      // Still open payment modal with transaction data as fallback
      setPaymentData({
        phoneNumber: selectedTransaction.phoneNumber || '',
        alternativePhoneNumber: '',
        amount: selectedTransaction.amount || '',
        useAlternativeNumber: false
      });

      setModalOpen(false);
      setShowPaymentModal(true);
      setMpesaStatus(null);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuickAmount = (amount, type = 'arrears') => {
    const customer = customerDetails || selectedTransaction?.customerId;

    if (type === 'fullBalance') {
      // Show full balance amount
      setPaymentData(prev => ({
        ...prev,
        amount: customer?.loanBalance || amount
      }));
    } else {
      // Set arrears amount
      setPaymentData(prev => ({
        ...prev,
        amount
      }));
    }
  };

  const handleSendPrompt = () => {
    // Determine which phone number to use
    const phoneToUse = paymentData.useAlternativeNumber
      ? paymentData.alternativePhoneNumber
      : paymentData.phoneNumber;

    if (!phoneToUse || !paymentData.amount) {
      setError('Please enter phone number and amount');
      return;
    }

    if (phoneToUse.length !== 12 || !phoneToUse.startsWith('254')) {
      setError('Please enter a valid Kenyan phone number (254XXXXXXXXX)');
      return;
    }

    // Check daily limit
    const amountNum = parseFloat(paymentData.amount);
    if (amountNum > 496500) {
      setError(`Daily MPESA limit exceeded. Maximum allowed is ${formatCurrency(496500)}`);
      return;
    }

    setShowConfirmationModal(true);
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessingPayment(true);
      setShowConfirmationModal(false);

      const token = localStorage.getItem('token');

      // Determine which phone number to use
      const phoneToUse = paymentData.useAlternativeNumber
        ? paymentData.alternativePhoneNumber
        : paymentData.phoneNumber;

      const response = await axios.post(
        'http://localhost:5000/api/payments/initiate',
        {
          phoneNumber: phoneToUse,
          amount: parseFloat(paymentData.amount),
          description: `Loan repayment${selectedTransaction?.customerId?.name ? ` for ${selectedTransaction.customerId.name}` : ''}`,
          customerId: selectedTransaction?.customerId?._id || selectedTransaction?.customerId,
          isAlternativeNumber: paymentData.useAlternativeNumber,
          originalPhoneNumber: paymentData.phoneNumber
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setMpesaStatus({
          status: 'pending',
          message: 'STK Push initiated successfully!',
          checkoutId: response.data.data.transaction?.transactionId,
          phoneUsed: phoneToUse
        });

        // Refresh transactions after 5 seconds
        setTimeout(() => {
          fetchTransactions();
        }, 5000);
      } else {
        setMpesaStatus({
          status: 'failed',
          message: response.data.message || 'Failed to initiate payment'
        });
      }
    } catch (error) {
      console.error('Error sending payment request:', error);
      setMpesaStatus({
        status: 'failed',
        message: error.response?.data?.message || 'Failed to send payment request. Please try again.'
      });
    } finally {
      setProcessingPayment(false);
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
      label: 'Successful',
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

            {/* Search and Filter Section */}
            <div className="transactions-search-container">
              <input
                type="text"
                placeholder="Search by customer, phone, or transaction ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="transactions-search-input"
              />

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="transactions-status-filter"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="transactions-error-message">
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
          ) : !transactions || transactions.length === 0 ? (
            <div className="transactions-empty-state">
              <div className="transactions-empty-icon">
                <Receipt sx={{ fontSize: 48, color: '#d4a762' }} />
              </div>
              <Typography className="transactions-empty-title">
                No Transactions Found
              </Typography>
              <Typography className="transactions-empty-subtitle">
                No transactions have been recorded yet.
              </Typography>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="transactions-empty-state">
              <div className="transactions-empty-icon">
                <HourglassEmpty sx={{ fontSize: 48, color: '#d4a762' }} />
              </div>
              <Typography className="transactions-empty-title">
                No Matching Transactions
              </Typography>
              <Typography className="transactions-empty-subtitle">
                Try adjusting your search or filter criteria.
              </Typography>
            </div>
          ) : (
            <>
              <div className="transactions-table-container">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th className="col-id">Transaction ID</th>
                      <th className="col-customer">Customer</th>
                      <th className="col-phone">Phone</th>
                      <th className="col-amount">Amount</th>
                      <th className="col-status">Status</th>
                      <th className="col-date">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((transaction, index) => {
                      const statusProps = getStatusProps(transaction.status);
                      return (
                        <tr
                          key={transaction._id || transaction.transactionId || `transaction-${index}`}
                          className="transactions-table-row clickable-row"
                          onClick={() => handleTransactionClick(transaction)}
                        >
                          <td title={transaction.transactionId || transaction._id || `TRX-${index}`}>
                            <span className="transaction-id">
                              {transaction.transactionId || transaction._id || `TRX-${index}`}
                            </span>
                          </td>
                          <td title={transaction.customerId?.name || transaction.customerName || 'N/A'}>
                            <span className="transaction-customer">
                              {transaction.customerId?.name || transaction.customerName || 'N/A'}
                            </span>
                          </td>
                          <td title={transaction.phoneNumber || 'N/A'}>
                            <span className="transaction-phone">
                              {transaction.phoneNumber || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className="transaction-amount">
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td>
                            <span className={`transactions-status-chip ${statusProps.class}`} title={statusProps.text}>
                              <span className="status-text">{statusProps.text}</span>
                            </span>
                          </td>
                          <td title={formatDate(transaction.createdAt)}>
                            <span className="transaction-date">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                      className="transactions-rows-select"
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

      {/* Transaction Details Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="transaction-details-modal"
        aria-describedby="transaction-details-description"
      >
        <Box className="transaction-modal-container">
          {selectedTransaction && (
            <div className="transaction-modal-content">
              {/* Modal Header */}
              <div className="transaction-modal-header">
                <div className="transaction-modal-header-content">
                  <ReceiptLong sx={{ fontSize: 24, color: '#5c4730' }} />
                  <div>
                    <Typography className="transaction-modal-title">
                      Transaction Details
                    </Typography>
                    <Typography className="transaction-modal-subtitle">
                      {selectedTransaction.transactionId || selectedTransaction._id}
                    </Typography>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Retry Payment Button in Header */}
                  {selectedTransaction.status?.toUpperCase() === 'PENDING' && (
                    <button
                      className="transactions-primary-btn"
                      onClick={handleRetryPayment}
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Retry Payment
                    </button>
                  )}
                  <IconButton
                    onClick={handleCloseModal}
                    className="transaction-modal-close-btn"
                    size="small"
                  >
                    <Close />
                  </IconButton>
                </div>
              </div>

              {/* Transaction Details Grid - COMPACT DESIGN */}
              <div className="transaction-modal-body">
                <div className="transaction-details-grid-compact">
                  {/* Left Column */}
                  <div className="transaction-column-compact">
                    {/* Customer Information Card */}
                    <div className="transaction-card-compact">
                      <div className="transaction-card-header-compact">
                        <Person sx={{ fontSize: 16, color: '#5c4730' }} />
                        <span>Customer Information</span>
                      </div>
                      <div className="transaction-card-content-compact">
                        <div className="transaction-detail-item-compact">
                          <span className="transaction-detail-label-compact">Name</span>
                          <span className="transaction-detail-value-compact">
                            {selectedTransaction.customerId?.name || selectedTransaction.customerName || 'N/A'}
                          </span>
                        </div>
                        <div className="transaction-detail-item-compact">
                          <span className="transaction-detail-label-compact">Phone</span>
                          <span className="transaction-detail-value-compact">
                            {selectedTransaction.phoneNumber || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Information Card */}
                    <div className="transaction-card-compact">
                      <div className="transaction-card-header-compact">
                        <Payment sx={{ fontSize: 16, color: '#5c4730' }} />
                        <span>Transaction Information</span>
                      </div>
                      <div className="transaction-card-content-compact">
                        <div className="transaction-detail-item-compact">
                          <span className="transaction-detail-label-compact">Date & Time</span>
                          <span className="transaction-detail-value-compact">
                            {formatDetailedDate(selectedTransaction.createdAt)}
                          </span>
                        </div>
                        <div className="transaction-detail-item-compact">
                          <span className="transaction-detail-label-compact">Payment Method</span>
                          <span className="transaction-detail-value-compact">
                            {selectedTransaction.paymentMethod || 'MPesa'}
                          </span>
                        </div>
                        <div className="transaction-detail-item-compact">
                          <span className="transaction-detail-label-compact">Amount</span>
                          <span className="transaction-detail-value-compact amount-highlight">
                            {formatCurrency(selectedTransaction.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="transaction-column-compact">
                    {/* Loan Balance Summary Card */}
                    <div className="transaction-card-compact loan-card-compact">
                      <div className="transaction-card-header-compact">
                        <AccountBalance sx={{ fontSize: 16, color: '#5c4730' }} />
                        <span>Loan Balance Summary</span>
                      </div>
                      <div className="transaction-card-content-compact">
                        {(() => {
                          const loanDetails = calculateLoanDetails(selectedTransaction);
                          return (
                            <>
                              {/* Current Loan Balance */}
                              <div className="transaction-detail-item-compact highlighted-compact">
                                <span className="transaction-detail-label-compact">
                                  Current Loan Balance
                                </span>
                                <span className="transaction-detail-value-compact balance-amount">
                                  {formatCurrency(loanDetails.totalLoanBalance)}
                                </span>
                              </div>

                              {/* Arrears Information */}
                              {loanDetails.arrearsAmount > 0 && (
                                <div className="transaction-detail-item-compact arrears-info-compact">
                                  <span className="transaction-detail-label-compact">
                                    Arrears Balance
                                  </span>
                                  <span className="transaction-detail-value-compact arrears-amount">
                                    {formatCurrency(loanDetails.arrearsAmount)}
                                  </span>
                                </div>
                              )}

                              {/* Total Repayments */}
                              <div className="transaction-detail-item-compact success-compact">
                                <span className="transaction-detail-label-compact">
                                  Total Repayments Made
                                </span>
                                <span className="transaction-detail-value-compact success-amount">
                                  {formatCurrency(loanDetails.totalRepayments)}
                                </span>
                              </div>

                              {selectedTransaction.status?.toUpperCase() === 'SUCCESS' ? (
                                <>
                                  {/* Total Cleared */}
                                  <div className="transaction-detail-item-compact total-cleared-compact">
                                    <span className="transaction-detail-label-compact">
                                      Total Cleared Now
                                    </span>
                                    <span className="transaction-detail-value-compact total-success-amount">
                                      {formatCurrency(loanDetails.totalCleared)}
                                    </span>
                                  </div>

                                  {/* New Loan Balance */}
                                  <div className="transaction-detail-item-compact new-balance-compact">
                                    <span className="transaction-detail-label-compact">
                                      New Loan Balance
                                    </span>
                                    <span className={`transaction-detail-value-compact ${loanDetails.isPaidOff ? 'paid-off-amount' : 'new-balance-amount'}`}>
                                      {formatCurrency(loanDetails.newLoanBalance)}
                                      {loanDetails.isPaidOff && (
                                        <span className="paid-off-badge-compact">
                                          <DoneAll sx={{ fontSize: 10, marginLeft: '0.25rem' }} />
                                          PAID OFF
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Remaining Arrears */}
                                  {loanDetails.remainingArrears > 0 && (
                                    <div className="transaction-detail-item-compact">
                                      <span className="transaction-detail-label-compact">
                                        Remaining Arrears
                                      </span>
                                      <span className="transaction-detail-value-compact remaining-arrears-amount">
                                        {formatCurrency(loanDetails.remainingArrears)}
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                /* For non-successful transactions */
                                <div className="transaction-detail-item-compact">
                                  <span className="transaction-detail-label-compact">
                                    Status Note
                                  </span>
                                  <span className="transaction-detail-value-compact pending-note-compact">
                                    Payment not processed. Loan balance remains unchanged.
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Transaction Status Card */}
                    <div className="transaction-card-compact status-card-compact">
                      <div className="transaction-card-header-compact">
                        <ReceiptLong sx={{ fontSize: 16, color: '#5c4730' }} />
                        <span>Transaction Status</span>
                      </div>
                      <div className="transaction-status-wrapper-compact">
                        {(() => {
                          const statusProps = getStatusProps(selectedTransaction.status);
                          return (
                            <div className={`transaction-status-display-compact ${statusProps.class}`}>
                              <div className="status-icon-compact">
                                {statusProps.icon}
                              </div>
                              <div>
                                <div className="transaction-status-text-compact">{statusProps.text}</div>
                                <div className="transaction-status-message-compact">
                                  {selectedTransaction.status?.toUpperCase() === 'SUCCESS'
                                    ? 'Payment successfully processed and applied to loan balance'
                                    : selectedTransaction.status?.toUpperCase() === 'PENDING'
                                      ? 'Payment is being processed. Loan balance will update upon completion.'
                                      : 'Transaction not completed. No changes to loan balance.'}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Box>
      </Modal>

      {/* Payment Modal - IMPROVED DATA DISPLAY */}
      {showPaymentModal && (
        <div
          className="payment-modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'payment-modal-overlay') {
              setShowPaymentModal(false);
              setMpesaStatus(null);
              setSelectedTransaction(null);
              setCustomerDetails(null);
            }
          }}
        >
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>

            <div className="payment-modal-header">
              <Typography className="payment-modal-title">
                Process Payment
              </Typography>
            </div>

            <div className="payment-modal-body">
              {/* Customer Information Section - IMPROVED */}
              <div className="payment-info-container">
                <div className="payment-info-item">
                  <span className="payment-info-label">Customer:</span>
                  <span className="payment-info-value">
                    {customerDetails?.name ||
                      selectedTransaction?.customerId?.name ||
                      selectedTransaction?.customerName ||
                      'Customer'}
                  </span>
                </div>
                <div className="payment-info-item">
                  <span className="payment-info-label">Customer ID:</span>
                  <span className="payment-info-value">
                    {customerDetails?.customerId ||
                      selectedTransaction?.customerId?.customerId ||
                      selectedTransaction?.customerId ||
                      'N/A'}
                  </span>
                </div>
              </div>

              <div className="payment-form-group">
                <label className="payment-form-label">Primary Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={paymentData.phoneNumber}
                  onChange={handlePaymentInputChange}
                  className="payment-form-input"
                  placeholder="2547XXXXXXXX"
                  maxLength="12"
                  disabled={paymentData.useAlternativeNumber}
                />
                <div className="phone-number-note">
                  {paymentData.phoneNumber ?
                    'Customer\'s registered phone number' :
                    'Enter customer phone number'}
                </div>
              </div>

              {/* Alternative Phone Number Section */}
              <div className="payment-form-group">
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="useAlternativeNumber"
                    name="useAlternativeNumber"
                    checked={paymentData.useAlternativeNumber}
                    onChange={handlePaymentInputChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="useAlternativeNumber" className="checkbox-label">
                    Use Alternative Phone Number
                  </label>
                </div>

                <div className={`alternative-input-container ${paymentData.useAlternativeNumber ? 'active' : 'disabled'}`}>
                  <label className="payment-form-label">Alternative Phone Number (254XXXXXXXXX)</label>
                  <input
                    type="text"
                    name="alternativePhoneNumber"
                    value={paymentData.alternativePhoneNumber}
                    onChange={handlePaymentInputChange}
                    className="payment-form-input"
                    placeholder="2547XXXXXXXX"
                    maxLength="12"
                    disabled={!paymentData.useAlternativeNumber}
                  />
                  <div className="alternative-number-note">
                    Use if primary number has insufficient funds
                  </div>
                </div>
              </div>

              <div className="payment-form-group">
                <label className="payment-form-label">Amount (KES)</label>
                <input
                  type="number"
                  name="amount"
                  value={paymentData.amount}
                  onChange={handlePaymentInputChange}
                  className="payment-form-input"
                  placeholder="Enter amount"
                  min="1"
                  step="1"
                />

                {/* Payment Amount Suggestions - IMPROVED */}
                <div className="payment-amount-suggestions">
                  <button
                    type="button"
                    className="payment-amount-btn"
                    onClick={() => {
                      const arrearsAmount = customerDetails?.arrears ||
                        selectedTransaction?.customerId?.arrears ||
                        0;
                      handleQuickAmount(arrearsAmount, 'arrears');
                    }}
                  >
                    Arrears: {formatCurrency(customerDetails?.arrears ||
                      selectedTransaction?.customerId?.arrears ||
                      0)}
                  </button>

                  <button
                    type="button"
                    className="payment-amount-btn"
                    onClick={() => {
                      const loanBalance = customerDetails?.loanBalance ||
                        selectedTransaction?.customerId?.loanBalance ||
                        0;
                      handleQuickAmount(loanBalance, 'fullBalance');
                    }}
                    style={{ width: '100%' }}
                  >
                    Full Balance: {formatCurrency(customerDetails?.loanBalance ||
                      selectedTransaction?.customerId?.loanBalance ||
                      0)}
                  </button>
                </div>

                <div className="daily-limit-info">
                  <strong>Note:</strong> Daily MPESA limit is {formatCurrency(496500)}. Amounts exceeding this will be capped.
                </div>
              </div>

              {/* Status Messages */}
              {mpesaStatus && (
                <div className={`mpesa-status ${mpesaStatus.status}`}>
                  <div className="mpesa-status-icon">
                    {mpesaStatus.status === 'success' ? '✅' :
                      mpesaStatus.status === 'failed' ? '❌' : '⏳'}
                  </div>
                  <div className="mpesa-status-message">{mpesaStatus.message}</div>
                  {mpesaStatus.checkoutId && (
                    <div className="mpesa-status-details">
                      Transaction ID: {mpesaStatus.checkoutId}
                      <br />
                      Phone Used: {mpesaStatus.phoneUsed}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="payment-modal-footer">
              <button
                className="payment-modal-cancel-btn"
                onClick={() => {
                  setShowPaymentModal(false);
                  setMpesaStatus(null);
                  // Clear transaction state when closing payment modal
                  setSelectedTransaction(null);
                  setCustomerDetails(null);
                }}
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button
                className="payment-modal-prompt-btn"
                onClick={handleSendPrompt}
                disabled={processingPayment || !paymentData.phoneNumber || !paymentData.amount}
              >
                {processingPayment ? 'Processing...' : 'Initiate Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="payment-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <div className="mpesa-logo-text">MPESA</div>
              </div>
              <Typography className="confirmation-modal-title">
                Confirm Payment Request
              </Typography>
            </div>

            <div className="confirmation-modal-body">
              <div className="confirmation-info">
                <div className="confirmation-label">
                  {paymentData.useAlternativeNumber ? 'Alternative Phone Number:' : 'Phone Number:'}
                </div>
                <div className="confirmation-phone">
                  {paymentData.useAlternativeNumber ? paymentData.alternativePhoneNumber : paymentData.phoneNumber}
                  {paymentData.useAlternativeNumber && (
                    <div className="alternative-original-note">
                      (Alternative to: {paymentData.phoneNumber})
                    </div>
                  )}
                </div>
                <div className="confirmation-label">
                  Amount:
                </div>
                <div className="confirmation-amount">
                  {formatCurrency(paymentData.amount)}
                  {parseFloat(paymentData.amount) > 496500 && (
                    <div className="daily-limit-warning">
                      ⚠️ Daily limit applied: {formatCurrency(496500)}
                    </div>
                  )}
                </div>
              </div>

              <div className="confirmation-note">
                <strong>Note:</strong> Customer will receive a payment prompt on their phone and must enter their PIN to complete the transaction.
                {parseFloat(paymentData.amount) > 496500 && (
                  <div className="daily-limit-alert">
                    <strong>⚠️ Daily Limit:</strong> Only {formatCurrency(496500)} can be collected at once (MPESA daily limit).
                  </div>
                )}
              </div>
            </div>

            <div className="confirmation-modal-footer">
              <button
                className="confirmation-modal-cancel-btn"
                onClick={() => setShowConfirmationModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirmation-modal-confirm-btn"
                onClick={handleConfirmPayment}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default TransactionsPage;