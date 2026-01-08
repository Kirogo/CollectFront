// src/pages/CustomerDetails.jsx - UPDATED WITH PAYMENT IMPROVEMENTS
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    LinearProgress,
    Alert
} from '@mui/material';
import {
    ArrowBack,
    Download,
    SendToMobile,
    Comment
} from '@mui/icons-material';
import axios from 'axios';
import '../styles/CustomerDetails.css';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    // Comment Section State
    const [newComment, setNewComment] = useState('');
    const [savingComment, setSavingComment] = useState(false);
    const [commentSaved, setCommentSaved] = useState(false);
    const [commentHistory, setCommentHistory] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // Payment Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showFullBalancePopup, setShowFullBalancePopup] = useState(false);
    const [paymentData, setPaymentData] = useState({
        phoneNumber: '',
        alternativePhoneNumber: '',
        amount: '',
        useAlternativeNumber: false
    });
    const [mpesaStatus, setMpesaStatus] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentInitiated, setPaymentInitiated] = useState(false);

    // Active transaction tracking
    const [hasActiveTransaction, setHasActiveTransaction] = useState(false);
    const [activeTransactionStatus, setActiveTransactionStatus] = useState(null);

    // Transaction filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Ref for auto-close timer
    const autoCloseTimerRef = useRef(null);

    // Clear any existing timer on unmount
    useEffect(() => {
        return () => {
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFullBalancePopup) {
                const popup = document.querySelector('.full-balance-popup-attached');
                const fullBalanceButton = document.querySelector('.payment-amount-btn-customer');

                if (popup &&
                    !popup.contains(event.target) &&
                    !fullBalanceButton?.contains(event.target)) {
                    setShowFullBalancePopup(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFullBalancePopup]);

    useEffect(() => {
        console.log('=== CUSTOMER DETAILS MOUNTED ===');
        console.log('ID from URL:', id);

        if (!id || id === 'undefined' || id === 'null') {
            console.error('❌ Invalid ID received');
            setError('Invalid customer ID');
            setLoading(false);
            return;
        }

        fetchCustomerDetails();
        fetchCustomerTransactions();
        fetchCustomerComments();
    }, [id]);

    useEffect(() => {
        if (customer && !loading) {
            syncLocalComments();
        }
    }, [customer, loading]);

    // Check for active transactions on component mount and when transactions change
    useEffect(() => {
        const checkActiveTransactions = () => {
            const activeTx = transactions.find(tx => {
                const status = tx.status?.toLowerCase();
                return status === 'pending' || status === 'initiated';
            });

            setHasActiveTransaction(!!activeTx);
            if (activeTx) {
                setActiveTransactionStatus(activeTx.status);
            }
        };

        checkActiveTransactions();
    }, [transactions]);

    // Poll for transaction status updates when there's an active transaction
    useEffect(() => {
        let pollInterval;

        if (hasActiveTransaction) {
            pollInterval = setInterval(() => {
                fetchCustomerTransactions();
            }, 5000); // Poll every 5 seconds
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [hasActiveTransaction, id]);

    const fetchCustomerDetails = async () => {
        console.log('🔄 Starting fetchCustomerDetails');

        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);

            if (!token) {
                console.error('❌ No authentication token found');
                navigate('/login');
                return;
            }

            console.log(`🔍 Making API call to: /customers/${id}`);

            const response = await axios.get(`http://localhost:5000/api/customers/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ API Response received:', response.status);

            if (response.data.success) {
                const customerData = response.data.data.customer;
                console.log('🎉 Customer data loaded');

                setCustomer(customerData);
                setPaymentData({
                    phoneNumber: customerData.phoneNumber || '',
                    alternativePhoneNumber: '',
                    amount: customerData.arrears || '',
                    useAlternativeNumber: false
                });
            } else {
                console.error('API returned success: false');
                setError(response.data.message || 'Failed to load customer details');
            }
        } catch (error) {
            console.error('❌ Error in fetchCustomerDetails:', error);

            if (error.response) {
                console.error('Response status:', error.response.status);

                if (error.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                    return;
                }

                if (error.response.status === 404) {
                    setError('Customer not found. The customer may have been deleted.');
                } else if (error.response.status === 400) {
                    setError('Invalid customer ID format');
                } else if (error.response.status === 500) {
                    setError('Server error: ' + (error.response.data?.message || 'Internal server error'));
                } else {
                    setError(error.response.data?.message || `Error ${error.response.status}: Failed to load customer details`);
                }
            } else if (error.request) {
                console.error('No response received from server');
                setError('No response from server. Please check your connection.');
            } else {
                console.error('Request setup error:', error.message);
                setError('Error setting up request: ' + error.message);
            }
        } finally {
            console.log('🔚 fetchCustomerDetails completed');
            setLoading(false);
        }
    };

    const fetchCustomerTransactions = async () => {
        if (!id || id === 'undefined') {
            console.log('Skipping transactions fetch - invalid ID');
            return;
        }

        try {
            setTransactionsLoading(true);
            console.log('🔄 Fetching transactions for customer:', id);

            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/transactions?customerId=${id}&limit=10&sort=-createdAt`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                const newTransactions = response.data.data || [];
                setTransactions(newTransactions);

                // Check if there are any active transactions
                const activeTx = newTransactions.find(tx => {
                    const status = tx.status?.toLowerCase();
                    return status === 'pending' || status === 'initiated';
                });

                setHasActiveTransaction(!!activeTx);
                if (activeTx) {
                    setActiveTransactionStatus(activeTx.status);
                } else {
                    setActiveTransactionStatus(null);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching transactions:', error.message);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const fetchCustomerComments = async () => {
        if (!id || id === 'undefined') return;

        try {
            setCommentsLoading(true);
            const token = localStorage.getItem('token');

            try {
                // Try to fetch from API first
                const response = await axios.get(`http://localhost:5000/api/customers/${id}/comments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.success) {
                    const comments = response.data.data.comments || [];
                    // Sort by createdAt descending (newest first)
                    const sortedComments = comments.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    setCommentHistory(sortedComments);

                    // Save to localStorage as backup cache
                    const commentsKey = `customer_comments_${id}`;
                    localStorage.setItem(commentsKey, JSON.stringify(sortedComments.slice(0, 50)));
                }
            } catch (apiError) {
                console.error('Error fetching comments from API:', apiError.message);

                // Fallback to localStorage
                const commentsKey = `customer_comments_${id}`;
                const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

                if (storedComments.length > 0) {
                    console.log('Using cached comments from localStorage');
                    setCommentHistory(storedComments);
                } else {
                    console.log('No comments found in cache');
                    setCommentHistory([]);
                }
            }
        } catch (error) {
            console.error('Error in fetchCustomerComments:', error);
        } finally {
            setCommentsLoading(false);
        }
    };

    const syncLocalComments = async () => {
        const commentsKey = `customer_comments_${id}`;
        const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
        const localComments = storedComments.filter(c => c.savedLocally);

        if (localComments.length === 0) return;

        try {
            const token = localStorage.getItem('token');

            for (const localComment of localComments) {
                try {
                    const commentData = {
                        comment: localComment.comment,
                        type: localComment.type || 'follow_up',
                        customerName: localComment.customerName || customer?.name || ''
                    };

                    const response = await axios.post(
                        `http://localhost:5000/api/customers/${id}/comments`,
                        commentData,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (response.data.success) {
                        // Update localStorage with server data
                        const updatedComments = storedComments.map(c => {
                            if (c._id === localComment._id) {
                                return response.data.data.comment;
                            }
                            return c;
                        }).filter(c => !c.savedLocally);

                        localStorage.setItem(commentsKey, JSON.stringify(updatedComments));

                        // Refresh comments from server
                        fetchCustomerComments();
                    }
                } catch (syncError) {
                    console.error('Failed to sync comment:', syncError);
                }
            }
        } catch (error) {
            console.error('Error in syncLocalComments:', error);
        }
    };

    const saveComment = async () => {
        if (!newComment.trim()) return;

        try {
            setSavingComment(true);

            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUser = user.name || user.username || 'Agent';

            const commentData = {
                comment: newComment.trim(),
                type: 'follow_up',
                customerName: customer?.name || ''
            };

            // Create optimistic update (temporary ID)
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const optimisticComment = {
                ...commentData,
                _id: tempId,
                author: currentUser,
                createdAt: new Date().toISOString(),
                customerId: id,
                comment: newComment.trim() // Ensure comment text is included
            };

            // Optimistically add to UI immediately
            setCommentHistory(prev => [optimisticComment, ...prev]);

            // Clear the input field
            const commentText = newComment;
            setNewComment('');

            // Try to save to backend API
            try {
                const response = await axios.post(
                    `http://localhost:5000/api/customers/${id}/comments`,
                    commentData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.success) {
                    const savedComment = response.data.data.comment || response.data.data;

                    // Replace temporary comment with saved one from server
                    setCommentHistory(prev =>
                        prev.map(comment =>
                            comment._id === tempId ? savedComment : comment
                        )
                    );

                    setCommentSaved(true);

                    // Update localStorage cache
                    const commentsKey = `customer_comments_${id}`;
                    const cachedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
                    // Remove temp comment and add saved one
                    const filteredCache = cachedComments.filter(c => c._id !== tempId);
                    const updatedCache = [savedComment, ...filteredCache];
                    localStorage.setItem(commentsKey, JSON.stringify(updatedCache.slice(0, 50)));

                    setTimeout(() => {
                        setCommentSaved(false);
                    }, 3000);
                } else {
                    console.error('❌ API returned success: false:', response.data.message);
                    throw new Error(response.data.message || 'Failed to save comment');
                }
            } catch (apiError) {
                console.error('❌ API save failed:', apiError.message);

                // Save to localStorage as fallback
                const commentsKey = `customer_comments_${id}`;
                const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

                const localComment = {
                    ...optimisticComment,
                    _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    savedLocally: true,
                    comment: commentText // Use the original comment text
                };

                // Remove temp comment and add local version
                const filteredStored = storedComments.filter(c => c._id !== tempId);
                const updatedComments = [localComment, ...filteredStored];
                localStorage.setItem(commentsKey, JSON.stringify(updatedComments.slice(0, 50)));

                // Update UI with localStorage version
                setCommentHistory(prev =>
                    prev.map(comment =>
                        comment._id === tempId ? localComment : comment
                    )
                );

                setCommentSaved(true);

                setTimeout(() => {
                    setCommentSaved(false);
                }, 3000);

                // Show warning that comment is saved locally only
                setError('Comment saved locally (server unavailable). Will sync when server is back.');
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error('❌ Error in saveComment:', error);
            setError('Failed to save comment. Please try again.');
        } finally {
            setSavingComment(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            return date.toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    };

    const formatTransactionDate = (dateString) => {
        if (!dateString) return { date: 'N/A', time: '' };

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return { date: 'Invalid date', time: '' };
            }

            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            let dateDisplay;
            if (diffDays === 0) dateDisplay = 'Today';
            else if (diffDays === 1) dateDisplay = 'Yesterday';
            else if (diffDays < 7) dateDisplay = `${diffDays} days ago`;
            else {
                dateDisplay = date.toLocaleDateString('en-KE', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            const timeDisplay = date.toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            return { date: dateDisplay, time: timeDisplay };
        } catch (error) {
            return { date: 'N/A', time: '' };
        }
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

    const handleRefreshTransactions = () => {
        setTransactionsLoading(true);
        fetchCustomerTransactions();
        setSearchTerm('');
        setStatusFilter('');
        setTimeout(() => {
            setTransactionsLoading(false);
        }, 500);
    };

    const getTransactionNumber = (transaction) => {
        // Try different possible fields for transaction number
        if (transaction.transactionId) return transaction.transactionId;
        if (transaction.mpesaReceiptNumber) return transaction.mpesaReceiptNumber;
        if (transaction.receiptNumber) return transaction.receiptNumber;
        if (transaction.checkoutRequestId) return `CHK${transaction.checkoutRequestId.substring(0, 8)}`;
        if (transaction._id) return `TRX${transaction._id.substring(0, 8).toUpperCase()}`;

        // Fallback to a generated ID
        return `TRX${Date.now().toString().substring(5)}`;
    };

    const getStatusColor = (arrears) => {
        const arrearsAmount = parseFloat(arrears || 0);
        if (arrearsAmount === 0) return 'current';
        if (arrearsAmount > 0 && arrearsAmount <= 1000) return 'warning';
        return 'delinquent';
    };

    const getStatusText = (arrears) => {
        const arrearsAmount = parseFloat(arrears || 0);
        if (arrearsAmount === 0) return 'Current';
        if (arrearsAmount > 0 && arrearsAmount <= 1000) return 'Warning';
        return 'In Arrears';
    };

    const getFailureReasonText = (failureReason) => {
        const reasons = {
            'INSUFFICIENT_FUNDS': 'Insufficient Funds',
            'TECHNICAL_ERROR': 'Technical Error',
            'WRONG_PIN': 'Wrong PIN',
            'USER_CANCELLED': 'User Cancelled',
            'NETWORK_ERROR': 'Network Error',
            'EXPIRED': 'Expired',
            'OTHER': 'Other'
        };
        return reasons[failureReason] || 'Unknown';
    };

    // Add this function for status display
    const getStatusDisplayText = (status, failureReason) => {
        const statusMap = {
            'success': 'Success',
            'failed': failureReason ? `Failed (${getFailureReasonText(failureReason)})` : 'Failed',
            'pending': 'Pending',
            'expired': 'Expired',
            'cancelled': 'Cancelled'
        };
        return statusMap[status?.toLowerCase()] || status || 'PENDING';
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = !searchTerm ||
            transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getTransactionNumber(transaction).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter ||
            transaction.status?.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const handleProcessPayment = () => {
        console.log('Opening payment modal');
        setShowPaymentModal(true);
        setMpesaStatus(null);
        setPaymentInitiated(false);
        // Reset alternative phone number field when modal opens
        setPaymentData(prev => ({
            ...prev,
            alternativePhoneNumber: '',
            useAlternativeNumber: false
        }));
    };

    const handleExportStatement = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/customers/${id}/statement`,
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
            link.setAttribute('download', `statement_${customer?.customerId || id}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting statement:', error);
            setError(error.response?.data?.message || 'Failed to export statement. Please try again.');
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
        console.log('handleQuickAmount called:', { type, amount });

        if (type === 'fullBalance') {
            console.log('Showing full balance popup');
            // Show popup attached to the button
            setShowFullBalancePopup(true);
        } else {
            // Directly set arrears amount
            setPaymentData(prev => ({
                ...prev,
                amount
            }));
        }
    };

    // Confirm full balance payment from simple popup
    const confirmFullBalanceFromPopup = () => {
        console.log('confirmFullBalanceFromPopup called');
        const amountNum = parseFloat(customer?.loanBalance || 0);

        // Check if amount exceeds daily limit
        if (amountNum > 496500) {
            // Show error message and set to max allowed
            setError(`Daily MPESA limit is ${formatCurrency(496500)}. The maximum amount that can be collected at once is ${formatCurrency(496500)}.`);
            setTimeout(() => setError(null), 5000);
            setPaymentData(prev => ({
                ...prev,
                amount: '496500'
            }));
        } else {
            // Set full balance amount
            setPaymentData(prev => ({
                ...prev,
                amount: customer?.loanBalance || ''
            }));
        }

        // Close the popup
        setShowFullBalancePopup(false);
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

        // Validate alternative phone number if enabled
        if (paymentData.useAlternativeNumber && paymentData.alternativePhoneNumber.length !== 12) {
            setError('Please enter a valid alternative Kenyan phone number (254XXXXXXXXX)');
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
            setPaymentInitiated(true);
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
                    description: `Loan repayment for ${customer?.name}`,
                    customerId: customer?._id || id,
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
                    status: 'success',
                    message: 'STK Push has been initiated successfully',
                    checkoutId: response.data.data.transaction?.transactionId,
                    phoneUsed: phoneToUse,
                    details: 'The customer has been prompted to enter their PIN on their phone. Please wait for payment confirmation.'
                });

                // Refresh transactions to get the new pending transaction
                fetchCustomerTransactions();
            } else {
                setMpesaStatus({
                    status: 'failed',
                    message: response.data.message || 'Failed to initiate payment',
                    details: 'Please try again or contact support if the issue persists.'
                });
                setPaymentInitiated(false);
                setProcessingPayment(false);
            }
        } catch (error) {
            console.error('Error sending payment request:', error);
            setMpesaStatus({
                status: 'failed',
                message: error.response?.data?.message || 'Failed to send payment request. Please try again.',
                details: 'Please check your network connection and try again.'
            });
            setPaymentInitiated(false);
            setProcessingPayment(false);
        }
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setMpesaStatus(null);
        setPaymentInitiated(false);
        setShowFullBalancePopup(false);
        setProcessingPayment(false);

        // Clear any pending auto-close timer
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
    };

    if (loading) {
        return (
            <Box className="customer-details-wrapper">
                <LinearProgress sx={{
                    mb: 2,
                    borderRadius: '4px',
                    backgroundColor: '#f5f0ea',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: '#5c4730'
                    }
                }} />
                <Typography sx={{ color: '#666', textAlign: 'center', fontSize: '0.875rem' }}>
                    Loading customer details...
                </Typography>
            </Box>
        );
    }

    if (error && !customer) {
        return (
            <Box className="customer-details-wrapper">
                <Alert severity="error" sx={{
                    mb: 2,
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '0.875rem'
                }}>
                    {error}
                </Alert>
                <button
                    className="customer-details-action-btn"
                    onClick={() => navigate('/customers')}
                >
                    Back to Customers
                </button>
            </Box>
        );
    }

    if (!customer) {
        return (
            <Box className="customer-details-wrapper">
                <Alert severity="warning" sx={{
                    mb: 2,
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb',
                    color: '#92400e',
                    border: '1px solid #fde68a'
                }}>
                    Customer not found
                </Alert>
                <button
                    className="customer-details-action-btn"
                    onClick={() => navigate('/customers')}
                >
                    Back to Customers
                </button>
            </Box>
        );
    }

    return (
        <Box className="customer-details-wrapper">
            {/* Header */}
            <Box className="customer-details-header">
                <div className="customer-details-header-content">
                    <div className="customer-details-title-section">
                        <button
                            onClick={() => navigate('/customers')}
                            className="back-button"
                        >
                            <ArrowBack sx={{ fontSize: 16 }} />
                            Back
                        </button>
                        <Box>
                            <Typography className="customer-details-title">
                                {customer?.customerId || customer?._id || id}
                            </Typography>
                        </Box>
                    </div>

                    <div className="customer-details-actions">
                        <button
                            className="customer-details-action-btn"
                            onClick={handleExportStatement}
                        >
                            <Download sx={{ fontSize: 16 }} />
                            Statement
                        </button>
                        <button
                            className="customer-details-primary-btn"
                            onClick={handleProcessPayment}
                            disabled={parseFloat(customer?.loanBalance || 0) <= 0 || hasActiveTransaction}
                            style={{
                                opacity: hasActiveTransaction ? 0.6 : 1,
                                cursor: hasActiveTransaction ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <SendToMobile sx={{ fontSize: 16 }} />
                            {hasActiveTransaction ? `Active (${activeTransactionStatus})` : 'Prompt'}
                        </button>
                    </div>
                </div>
            </Box>

            {/* Main Content */}
            <div className="customer-details-container">
                {/* Top Row: Customer Info & Loan Details Side by Side */}
                <div className="top-row-cards">
                    {/* Customer Information Card */}
                    <div className="details-card customer-details-card">
                        <div className="card-header">
                            <Typography className="card-title">
                                Customer Information
                            </Typography>
                        </div>

                        <div className="card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <div className="info-label">Customer ID</div>
                                    <div className="info-value">{customer?.customerId || 'N/A'}</div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Full Name</div>
                                    <div className="info-value">{customer?.name || 'N/A'}</div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Phone Number</div>
                                    <div className="info-value">{customer?.phoneNumber || 'N/A'}</div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Email Address</div>
                                    <div className="info-value">{customer?.email || 'N/A'}</div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">National ID</div>
                                    <div className="info-value">{customer?.nationalId || 'N/A'}</div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Account Number</div>
                                    <div className="info-value">{customer?.accountNumber || 'N/A'}</div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Date Added</div>
                                    <div className="info-value">
                                        {customer?.createdAt ? formatDate(customer.createdAt) : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loan Details Card */}
                    <div className="details-card loan-details-card">
                        <div className="card-header">
                            <Typography className="card-title">
                                Loan Details
                            </Typography>
                            <span className={`status-badge ${getStatusColor(customer?.arrears)}`}>
                                {getStatusText(customer?.arrears)}
                            </span>
                        </div>

                        <div className="card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <div className="info-label">Loan Balance</div>
                                    <div className="info-value amount">
                                        {formatCurrency(customer?.loanBalance)}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Arrears Amount</div>
                                    <div className={`info-value amount ${getStatusColor(customer?.arrears)}`}>
                                        {formatCurrency(customer?.arrears)}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Total Repayments</div>
                                    <div className="info-value amount success">
                                        {formatCurrency(customer?.totalRepayments || 0)}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Last Payment Date</div>
                                    <div className="info-value">
                                        {customer?.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'No payments'}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Status</div>
                                    <div className={`info-value status ${getStatusColor(customer?.arrears)}`}>
                                        {getStatusText(customer?.arrears)}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Account Status</div>
                                    <div className="info-value">
                                        <span className={customer?.isActive ? 'active-status' : 'inactive-status'}>
                                            {customer?.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Comment Section & Recent Transactions */}
                <div className="bottom-row-cards">
                    {/* Customer Follow-up Comments Card */}
                    <div className="details-card comment-card">
                        <div className="card-header">
                            <Typography className="card-title">
                                <Comment sx={{ fontSize: 16, marginRight: '0.5rem' }} />
                                Customer Follow-up
                            </Typography>
                        </div>

                        <div className="card-body">
                            {/* Comment Input Section */}
                            <div className="comment-input-section">
                                <textarea
                                    className="comment-textarea"
                                    placeholder="Add notes about customer follow-up, payment promises, or reasons for non-payment. This will be included in reports..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows="4"
                                />

                                <div className="comment-actions">
                                    <button
                                        className="comment-save-btn"
                                        onClick={saveComment}
                                        disabled={savingComment || !newComment.trim()}
                                    >
                                        {savingComment ? 'Saving...' : commentSaved ? '✓ Saved' : 'Save Comment'}
                                    </button>
                                </div>
                            </div>

                            {/* Comment History Section */}
                            <div className="comment-history-section">
                                <div className="comment-history-title">
                                    Comment History
                                    {commentsLoading && <span className="loading-indicator">Loading...</span>}
                                </div>

                                <div className="comment-history-container">
                                    {commentsLoading ? (
                                        <div className="loading-comments">
                                            <Typography sx={{ color: '#666', textAlign: 'center', py: 2, fontSize: '0.875rem' }}>
                                                Loading comments...
                                            </Typography>
                                        </div>
                                    ) : commentHistory.length === 0 ? (
                                        <div className="no-comments">
                                            <div className="no-comments-icon">📝</div>
                                            <Typography className="no-comments-text">
                                                No comments yet. Add a comment above to start the conversation.
                                            </Typography>
                                        </div>
                                    ) : (
                                        commentHistory.map((commentItem) => (
                                            <div key={commentItem._id} className="comment-history-item">
                                                {commentItem.savedLocally && (
                                                    <div className="local-comment-badge" title="Saved locally (not synced to server)">
                                                        📱 Local
                                                    </div>
                                                )}
                                                <div className="comment-history-content">
                                                    {commentItem.comment}
                                                </div>
                                                <div className="comment-history-meta">
                                                    <span className="comment-history-author">
                                                        {commentItem.author || 'Agent'}
                                                    </span>
                                                    <span className="comment-history-date">
                                                        {formatDate(commentItem.createdAt)}
                                                        {commentItem.savedLocally && ' (Local)'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions Card - SIMPLIFIED */}
                    <div className="details-card transactions-card">
                        <div className="card-header">
                            <Typography className="card-title">
                                Recent Transactions
                            </Typography>
                            <button
                                className="customer-details-action-btn"
                                onClick={handleRefreshTransactions}
                                style={{
                                    fontSize: '12px',
                                    padding: '6px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                                </svg>
                                Refresh
                            </button>
                        </div>

                        <div className="card-body simple-transactions-container">
                            {/* Transaction Filters */}
                            <div className="simple-filters">
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="simple-search-input"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="simple-status-filter"
                                >
                                    <option value="">All Status</option>
                                    <option value="success">Success</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {transactionsLoading ? (
                                <div className="simple-loading">
                                    <div className="simple-spinner"></div>
                                    <div className="simple-loading-text">Loading transactions...</div>
                                </div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="simple-empty-state">
                                    <div className="simple-empty-icon">📄</div>
                                    <div className="simple-empty-text">
                                        {searchTerm || statusFilter ? 'No transactions match your filters' : 'No transactions found for this customer'}
                                    </div>
                                    {(searchTerm || statusFilter) && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setStatusFilter('');
                                            }}
                                            className="simple-clear-btn"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="simple-table-wrapper">
                                        <table className="simple-transactions-table">
                                            <thead>
                                                <tr>
                                                    <th>Transaction No</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTransactions.map((transaction) => {
                                                    const { date, time } = formatTransactionDate(transaction.createdAt);
                                                    const status = transaction.status?.toLowerCase();

                                                    return (
                                                        <tr key={transaction._id || transaction.transactionId}>
                                                            <td className="simple-transaction-id">
                                                                {getTransactionNumber(transaction)}
                                                            </td>
                                                            <td className="simple-amount">
                                                                {formatCurrency(transaction.amount)}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className="simple-status"
                                                                    style={{
                                                                        backgroundColor: status === 'success' ? '#d1fae5' :
                                                                            status === 'pending' ? '#fef3c7' :
                                                                                status === 'failed' ? '#fee2e2' :
                                                                                    status === 'expired' ? '#f3f4f6' : '#f3f4f6',
                                                                        color: status === 'success' ? '#059669' :
                                                                            status === 'pending' ? '#d97706' :
                                                                                status === 'failed' ? '#dc2626' : '#6b7280',
                                                                        borderColor: status === 'success' ? '#a7f3d0' :
                                                                            status === 'pending' ? '#fde68a' :
                                                                                status === 'failed' ? '#fecaca' : '#d1d5db'
                                                                    }}
                                                                >
                                                                    {getStatusDisplayText(transaction.status, transaction.failureReason)}
                                                                </span>
                                                            </td>
                                                            <td className="simple-date">
                                                                <div className="simple-date-text">{date}</div>
                                                                <div className="simple-time-text">{time}</div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Total row - Successful transactions only */}
                                    {(() => {
                                        const successfulTotal = filteredTransactions
                                            .filter(transaction => transaction.status?.toLowerCase() === 'success')
                                            .reduce((sum, transaction) => sum + parseFloat(transaction.amount || 0), 0);

                                        return successfulTotal > 0 ? (
                                            <div className="simple-total-row">
                                                <div className="simple-total-label">Total Successful:</div>
                                                <div className="simple-total-amount">{formatCurrency(successfulTotal)}</div>
                                            </div>
                                        ) : null;
                                    })()}

                                    <div className="simple-count">
                                        Showing {filteredTransactions.length} of {transactions.length} transactions
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal - UPDATED WITH SUCCESS MESSAGE INSIDE */}
            {showPaymentModal && (
                <div className="payment-modal-overlay-customer">
                    <div className="payment-modal-customer">
                        <div className="payment-modal-header-customer">
                            <Typography className="payment-modal-title-customer">
                                Process Payment
                            </Typography>
                        </div>

                        <div className="payment-modal-body-customer">
                            {/* Success Message displayed right under the header */}
                            {mpesaStatus && mpesaStatus.status === 'success' && (
                                <div className="mpesa-status-inline-customer success">
                                    <div className="mpesa-status-icon-customer">✅</div>
                                    <div className="mpesa-status-content-customer">
                                        <div className="mpesa-status-message-customer">{mpesaStatus.message}</div>
                                        {mpesaStatus.details && (
                                            <div className="mpesa-status-details-customer">{mpesaStatus.details}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Failed Message */}
                            {mpesaStatus && mpesaStatus.status === 'failed' && (
                                <div className="mpesa-status-inline-customer failed">
                                    <div className="mpesa-status-icon-customer">❌</div>
                                    <div className="mpesa-status-content-customer">
                                        <div className="mpesa-status-message-customer">{mpesaStatus.message}</div>
                                        {mpesaStatus.details && (
                                            <div className="mpesa-status-details-customer">{mpesaStatus.details}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Only show form if payment hasn't been successfully initiated */}
                            {(!mpesaStatus || mpesaStatus.status !== 'success') ? (
                                <>
                                    <div className="payment-info-container-customer">
                                        <div className="payment-info-item-customer">
                                            <span className="payment-info-label-customer">Customer:</span>
                                            <span className="payment-info-value-customer">{customer?.name}</span>
                                        </div>
                                    </div>

                                    <div className="payment-form-group-customer">
                                        <label className="payment-form-label-customer">Primary Phone Number</label>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={paymentData.phoneNumber}
                                            onChange={handlePaymentInputChange}
                                            className="payment-form-input-customer"
                                            placeholder="2547XXXXXXXX"
                                            maxLength="12"
                                            disabled={paymentData.useAlternativeNumber || paymentInitiated}
                                        />
                                        <div className="phone-number-note-customer">
                                            Customer's registered phone number
                                        </div>
                                    </div>

                                    {/* Alternative Phone Number Section */}
                                    <div className="payment-form-group-customer">
                                        <div className="checkbox-container-customer">
                                            <input
                                                type="checkbox"
                                                id="useAlternativeNumber"
                                                name="useAlternativeNumber"
                                                checked={paymentData.useAlternativeNumber}
                                                onChange={handlePaymentInputChange}
                                                className="checkbox-input-customer"
                                                disabled={paymentInitiated}
                                            />
                                            <label htmlFor="useAlternativeNumber" className="checkbox-label-customer">
                                                Use Alternative Phone Number
                                            </label>
                                        </div>

                                        <div className={`alternative-input-container-customer ${paymentData.useAlternativeNumber ? 'active' : 'disabled'}`}>
                                            <label className="payment-form-label-customer">Alternative Phone Number (254XXXXXXXXX)</label>
                                            <input
                                                type="text"
                                                name="alternativePhoneNumber"
                                                value={paymentData.alternativePhoneNumber}
                                                onChange={handlePaymentInputChange}
                                                className="payment-form-input-customer"
                                                placeholder="2547XXXXXXXX"
                                                maxLength="12"
                                                disabled={!paymentData.useAlternativeNumber || paymentInitiated}
                                            />
                                            <div className="alternative-number-note-customer">
                                                Use if primary number has insufficient funds
                                            </div>
                                        </div>
                                    </div>

                                    <div className="payment-form-group-customer">
                                        <label className="payment-form-label-customer">Amount (KES)</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={paymentData.amount}
                                            onChange={handlePaymentInputChange}
                                            className="payment-form-input-customer"
                                            placeholder="Enter amount"
                                            min="1"
                                            step="1"
                                            disabled={paymentInitiated}
                                        />

                                        <div className="payment-amount-suggestions-customer">
                                            <button
                                                type="button"
                                                className="payment-amount-btn-customer"
                                                onClick={() => handleQuickAmount(customer?.arrears || '', 'arrears')}
                                                disabled={paymentInitiated}
                                            >
                                                Arrears: {formatCurrency(customer?.arrears)}
                                            </button>

                                            {/* Full Balance button with popup container */}
                                            <div className="full-balance-button-container">
                                                <button
                                                    type="button"
                                                    className="payment-amount-btn-customer"
                                                    onClick={() => handleQuickAmount(customer?.loanBalance || '', 'fullBalance')}
                                                    style={{ width: '100%' }}
                                                    disabled={paymentInitiated}
                                                >
                                                    Full Balance: {formatCurrency(customer?.loanBalance)}
                                                </button>

                                                {/* Full Balance Popup - Attached to Button */}
                                                {showFullBalancePopup && (
                                                    <div className="full-balance-popup-attached">
                                                        <div className="popup-content-attached">
                                                            <Typography className="popup-message-attached">
                                                                Are you sure you want to clear the full balance?
                                                            </Typography>
                                                            <div className="popup-actions-attached">
                                                                <button
                                                                    className="popup-cancel-btn-attached"
                                                                    onClick={() => setShowFullBalancePopup(false)}
                                                                >
                                                                    No
                                                                </button>
                                                                <button
                                                                    className="popup-confirm-btn-attached"
                                                                    onClick={confirmFullBalanceFromPopup}
                                                                >
                                                                    Yes
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="daily-limit-info-customer">
                                            <strong>Note:</strong> Daily MPESA limit is {formatCurrency(496500)}. Amounts exceeding this will be capped.
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Show only success message when payment is successful
                                <div className="payment-success-content-customer">
                                    <div className="success-checkmark-customer">✓</div>
                                    <Typography className="success-title-customer">
                                        Payment Request Sent Successfully
                                    </Typography>
                                    <Typography className="success-details-customer">
                                        A payment prompt has been sent to {mpesaStatus?.phoneUsed || 'customer'}.<br />
                                        Waiting for customer to enter PIN...
                                    </Typography>
                                    <div className="success-info-box-customer">
                                        <div className="success-info-item-customer">
                                            <span className="success-info-label-customer">Amount:</span>
                                            <span className="success-info-value-customer">{formatCurrency(paymentData.amount)}</span>
                                        </div>
                                        <div className="success-info-item-customer">
                                            <span className="success-info-label-customer">Phone Number:</span>
                                            <span className="success-info-value-customer">{mpesaStatus?.phoneUsed}</span>
                                        </div>
                                        <div className="success-info-item-customer">
                                            <span className="success-info-label-customer">Reference:</span>
                                            <span className="success-info-value-customer">{mpesaStatus?.checkoutId || 'Pending...'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODAL FOOTER - UPDATED FOR TWO BUTTONS */}
                        <div className="payment-modal-footer-customer">
                            {/* Always show Close button - different label based on state */}
                            <button
                                className="payment-modal-cancel-btn-customer"
                                onClick={closePaymentModal}
                            >
                                Close
                            </button>

                            {/* Show Processing button when payment is being processed OR after successful initiation */}
                            {(processingPayment || (mpesaStatus && mpesaStatus.status === 'success')) && (
                                <button
                                    className="payment-modal-processing-btn-customer"
                                    disabled={true}
                                >
                                    <div className="processing-spinner"></div>
                                    Processing...
                                </button>
                            )}

                            {/* Show Initiate Payment button only when form is visible and not in processing/success state */}
                            {(!mpesaStatus || mpesaStatus.status !== 'success') && !processingPayment && (
                                <button
                                    className="payment-modal-prompt-btn-customer"
                                    onClick={handleSendPrompt}
                                    disabled={!paymentData.phoneNumber || !paymentData.amount || paymentInitiated}
                                    style={{
                                        backgroundColor: paymentInitiated ? '#cccccc' : '',
                                        color: paymentInitiated ? '#666666' : '',
                                        cursor: paymentInitiated ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {paymentInitiated ? 'Payment Initiated' : 'Initiate Payment'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmationModal && (
                <div className="payment-modal-overlay-customer">
                    <div className="confirmation-modal-customer">
                        <div className="confirmation-modal-header-customer">
                            <div className="confirmation-modal-icon-customer">
                                <div className="mpesa-logo-text-customer">MPESA</div>
                            </div>
                            <Typography className="confirmation-modal-title-customer">
                                Confirm Payment Request
                            </Typography>
                        </div>

                        <div className="confirmation-modal-body-customer">
                            <div className="confirmation-info-customer">
                                <div className="confirmation-label-customer">
                                    {paymentData.useAlternativeNumber ? 'Alternative Phone Number:' : 'Phone Number:'}
                                </div>
                                <div className="confirmation-phone-customer">
                                    {paymentData.useAlternativeNumber ? paymentData.alternativePhoneNumber : paymentData.phoneNumber}
                                    {paymentData.useAlternativeNumber && (
                                        <div className="alternative-original-note-customer">
                                            (Alternative to: {paymentData.phoneNumber})
                                        </div>
                                    )}
                                </div>
                                <div className="confirmation-label-customer">
                                    Amount:
                                </div>
                                <div className="confirmation-amount-customer">
                                    {formatCurrency(paymentData.amount)}
                                    {parseFloat(paymentData.amount) > 496500 && (
                                        <div className="daily-limit-warning-customer">
                                            ⚠️ Daily limit applied: {formatCurrency(496500)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="confirmation-note-customer">
                                <strong>Note:</strong> Customer will receive a payment prompt on their phone and must enter their PIN to complete the transaction.
                                {parseFloat(paymentData.amount) > 496500 && (
                                    <div className="daily-limit-alert-customer">
                                        <strong>⚠️ Daily Limit:</strong> Only {formatCurrency(496500)} can be collected at once (MPESA daily limit).
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="confirmation-modal-footer-customer">
                            <button
                                className="confirmation-modal-cancel-btn-customer"
                                onClick={() => setShowConfirmationModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirmation-modal-confirm-btn-customer"
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

export default CustomerDetails;