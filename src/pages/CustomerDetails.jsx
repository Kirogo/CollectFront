// src/pages/CustomerDetails.jsx - UPDATED WITH PERSISTENT COMMENTS
import React, { useState, useEffect } from 'react';
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
    Payment,
    History,
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
    const [paymentData, setPaymentData] = useState({
        phoneNumber: '',
        amount: ''
    });
    const [mpesaStatus, setMpesaStatus] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);

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
                    amount: customerData.arrears || ''
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
            const response = await axios.get(`http://localhost:5000/api/transactions?customerId=${id}&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setTransactions(response.data.data || []);
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

            console.log('🔄 Fetching comments for customer ID:', id);
            console.log('Token exists:', !!token);

            try {
                // Try to fetch from API first
                const response = await axios.get(`http://localhost:5000/api/customers/${id}/comments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log('✅ Comments API response status:', response.status);
                console.log('✅ Comments API response data:', response.data);

                if (response.data.success) {
                    const comments = response.data.data.comments || [];
                    console.log(`📝 Found ${comments.length} comments from API`);

                    // Log each comment to see its structure
                    comments.forEach((comment, index) => {
                        console.log(`Comment ${index + 1}:`, {
                            _id: comment._id,
                            comment: comment.comment,
                            author: comment.author,
                            createdAt: comment.createdAt,
                            hasCommentText: !!comment.comment,
                            hasAuthor: !!comment.author
                        });
                    });

                    // Sort by createdAt descending (newest first)
                    const sortedComments = comments.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    setCommentHistory(sortedComments);

                    // Save to localStorage as backup cache
                    const commentsKey = `customer_comments_${id}`;
                    localStorage.setItem(commentsKey, JSON.stringify(sortedComments.slice(0, 50)));
                } else {
                    console.error('❌ Comments API returned success: false:', response.data.message);
                }
            } catch (apiError) {
                console.error('❌ Error fetching comments from API:', apiError.message);
                console.error('❌ API error response:', apiError.response?.data);
                console.error('❌ API error status:', apiError.response?.status);

                // Fallback to localStorage
                const commentsKey = `customer_comments_${id}`;
                const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

                console.log(`📦 Found ${storedComments.length} cached comments in localStorage`);

                if (storedComments.length > 0) {
                    console.log('Using cached comments from localStorage');
                    // Log localStorage comments structure
                    storedComments.forEach((comment, index) => {
                        console.log(`LocalStorage Comment ${index + 1}:`, {
                            _id: comment._id,
                            comment: comment.comment,
                            author: comment.author,
                            createdAt: comment.createdAt
                        });
                    });
                    setCommentHistory(storedComments);
                } else {
                    console.log('No comments found in cache');
                    setCommentHistory([]);
                }
            }
        } catch (error) {
            console.error('❌ Error in fetchCustomerComments:', error);
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

            console.log('💾 Saving comment for user:', currentUser);
            console.log('Comment text:', newComment);

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

            console.log('Optimistic comment:', optimisticComment);

            // Optimistically add to UI immediately
            setCommentHistory(prev => [optimisticComment, ...prev]);

            // Clear the input field
            const commentText = newComment;
            setNewComment('');

            // Try to save to backend API
            try {
                console.log('📡 Sending comment to API...');
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

                console.log('✅ API save response:', response.data);

                if (response.data.success) {
                    const savedComment = response.data.data.comment || response.data.data;
                    console.log('✅ Comment saved to server:', savedComment);

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

                    console.log('💾 Updated localStorage cache');

                    setTimeout(() => {
                        setCommentSaved(false);
                    }, 3000);
                } else {
                    console.error('❌ API returned success: false:', response.data.message);
                    throw new Error(response.data.message || 'Failed to save comment');
                }
            } catch (apiError) {
                console.error('❌ API save failed:', apiError.message);
                console.error('❌ API error details:', apiError.response?.data);

                // Save to localStorage as fallback
                const commentsKey = `customer_comments_${id}`;
                const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

                const localComment = {
                    ...optimisticComment,
                    _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    savedLocally: true,
                    comment: commentText // Use the original comment text
                };

                console.log('💾 Saving comment locally:', localComment);

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

    const formatCurrency = (amount) => {
        const numAmount = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
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

    const handleProcessPayment = () => {
        setShowPaymentModal(true);
        setMpesaStatus(null);
    };

    const handleViewAllTransactions = () => {
        navigate(`/transactions?customerId=${id}`);
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
        const { name, value } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleQuickAmount = (amount) => {
        setPaymentData(prev => ({
            ...prev,
            amount
        }));
    };

    const handleSendPrompt = () => {
        if (!paymentData.phoneNumber || !paymentData.amount) {
            setError('Please enter phone number and amount');
            return;
        }

        if (paymentData.phoneNumber.length !== 12 || !paymentData.phoneNumber.startsWith('254')) {
            setError('Please enter a valid Kenyan phone number (254XXXXXXXXX)');
            return;
        }

        setShowConfirmationModal(true);
    };

    const handleConfirmPayment = async () => {
        try {
            setProcessingPayment(true);
            setShowConfirmationModal(false);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/payments/initiate',
                {
                    phoneNumber: paymentData.phoneNumber,
                    amount: parseFloat(paymentData.amount),
                    description: `Loan repayment for ${customer?.name}`,
                    customerId: customer?._id || id
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
                    checkoutId: response.data.data.transaction?.transactionId
                });

                // Refresh data after 5 seconds
                setTimeout(() => {
                    fetchCustomerDetails();
                    fetchCustomerTransactions();
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
                            <Typography className="customer-details-subtitle">
                                {customer?.name || 'Customer Details'}
                            </Typography>
                        </Box>
                    </div>

                    <div className="customer-details-actions">
                        <button
                            className="customer-details-action-btn"
                            onClick={handleExportStatement}
                        >
                            <Download sx={{ fontSize: 16 }} />
                            Export Statement
                        </button>
                        <button
                            className="customer-details-primary-btn"
                            onClick={handleProcessPayment}
                            disabled={parseFloat(customer?.loanBalance || 0) <= 0}
                        >
                            <Payment sx={{ fontSize: 16 }} />
                            Process Payment
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

                    {/* Recent Transactions Card */}
                    <div className="details-card transactions-card">
                        <div className="card-header">
                            <Typography className="card-title">
                                Recent Transactions
                            </Typography>
                            <button
                                className="customer-details-action-btn"
                                onClick={handleViewAllTransactions}
                            >
                                <History sx={{ fontSize: 14 }} />
                                View All
                            </button>
                        </div>

                        <div className="card-body transactions-table-container">
                            {transactionsLoading ? (
                                <div className="empty-state">
                                    <LinearProgress sx={{
                                        mb: 1.5,
                                        borderRadius: '4px',
                                        backgroundColor: '#f5f0ea',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#5c4730'
                                        }
                                    }} />
                                    <Typography className="empty-text">
                                        Loading transactions...
                                    </Typography>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📊</div>
                                    <Typography className="empty-text">
                                        No transactions found for this customer
                                    </Typography>
                                </div>
                            ) : (
                                <table className="transactions-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '15%' }}>Date</th>
                                            <th style={{ width: '35%' }}>Description</th>
                                            <th style={{ width: '20%' }}>Amount</th>
                                            <th style={{ width: '15%' }}>Status</th>
                                            <th style={{ width: '15%' }}>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction) => (
                                            <tr key={transaction._id || transaction.transactionId}>
                                                <td>{formatDate(transaction.createdAt)}</td>
                                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {transaction.description || 'Loan Repayment'}
                                                </td>
                                                <td className={`transaction-amount ${transaction.status === 'SUCCESS' ? 'credit' : 'pending'}`}>
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td>
                                                    <span className={`transaction-status ${transaction.status?.toLowerCase()}`}>
                                                        {transaction.status || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td>{transaction.paymentMethod || 'MPESA'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="payment-modal-overlay">
                    <div className="payment-modal">
                        <div className="payment-modal-header">
                            <Typography className="payment-modal-title">
                                Process Payment
                            </Typography>
                        </div>

                        <div className="payment-modal-body">
                            <div className="payment-info-container">
                                <div className="payment-info-item">
                                    <span className="payment-info-label">Customer:</span>
                                    <span className="payment-info-value">{customer?.name}</span>
                                </div>
                                <div className="payment-info-item">
                                    <span className="payment-info-label">Account:</span>
                                    <span className="payment-info-value">{customer?.accountNumber}</span>
                                </div>
                                <div className="payment-info-item">
                                    <span className="payment-info-label">Loan Balance:</span>
                                    <span className="payment-info-value amount">{formatCurrency(customer?.loanBalance)}</span>
                                </div>
                                <div className="payment-info-item">
                                    <span className="payment-info-label">Arrears:</span>
                                    <span className="payment-info-value amount">{formatCurrency(customer?.arrears)}</span>
                                </div>
                            </div>

                            <div className="payment-form-group">
                                <label className="payment-form-label">Phone Number (254XXXXXXXXX)</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={paymentData.phoneNumber}
                                    onChange={handlePaymentInputChange}
                                    className="payment-form-input"
                                    placeholder="2547XXXXXXXX"
                                    maxLength="12"
                                />
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

                                <div className="payment-amount-suggestions">
                                    <button
                                        type="button"
                                        className="payment-amount-btn"
                                        onClick={() => handleQuickAmount(customer?.arrears || '')}
                                    >
                                        Arrears: {formatCurrency(customer?.arrears)}
                                    </button>
                                    <button
                                        type="button"
                                        className="payment-amount-btn"
                                        onClick={() => handleQuickAmount(customer?.loanBalance || '')}
                                    >
                                        Full Balance: {formatCurrency(customer?.loanBalance)}
                                    </button>
                                </div>
                            </div>

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
                                Confirm Payment
                            </Typography>
                            <Typography className="confirmation-modal-subtitle">
                                Verify details before sending
                            </Typography>
                        </div>

                        <div className="confirmation-modal-body">
                            <div className="confirmation-info">
                                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                                    Phone number:
                                </div>
                                <div className="confirmation-phone">
                                    {paymentData.phoneNumber}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                                    Amount:
                                </div>
                                <div className="confirmation-amount">
                                    {formatCurrency(paymentData.amount)}
                                </div>
                            </div>

                            <div className="confirmation-note">
                                <strong>Note:</strong> Customer will receive a payment prompt on their phone and must enter their PIN to complete the transaction.
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
                                Send Payment Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    );
};

export default CustomerDetails;