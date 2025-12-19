// src/pages/CustomerDetails.jsx - UPDATED LAYOUT
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
    const [comment, setComment] = useState('');
    const [commentDate, setCommentDate] = useState('');
    const [savingComment, setSavingComment] = useState(false);
    const [commentSaved, setCommentSaved] = useState(false);

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
        fetchCustomerDetails();
        fetchCustomerTransactions();
        fetchCustomerComments();
    }, [id]);

    const fetchCustomerDetails = async () => {
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

            const response = await authAxios.get(`/customers/${id}`);

            if (response.data.success) {
                const customerData = response.data.data.customer;
                setCustomer(customerData);
                setPaymentData({
                    phoneNumber: customerData.phoneNumber || '',
                    amount: customerData.arrears || ''
                });
            } else {
                setError('Failed to load customer details');
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }

            setError('Failed to load customer details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerTransactions = async () => {
        try {
            setTransactionsLoading(true);

            const token = localStorage.getItem('token');
            const authAxios = axios.create({
                baseURL: 'http://localhost:5000/api',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const response = await authAxios.get(`/transactions?customerId=${id}&limit=5`);

            if (response.data.success) {
                setTransactions(response.data.data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const fetchCustomerComments = async () => {
        try {
            const token = localStorage.getItem('token');
            const authAxios = axios.create({
                baseURL: 'http://localhost:5000/api',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const response = await authAxios.get(`/customers/${id}/comments`);

            if (response.data.success && response.data.data.comments.length > 0) {
                const latestComment = response.data.data.comments[0];
                setComment(latestComment.comment || '');
                setCommentDate(latestComment.createdAt || '');
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            // If endpoint doesn't exist, ignore
        }
    };

    const saveComment = async () => {
        if (!comment.trim()) return;

        try {
            setSavingComment(true);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/customers/${id}/comments`,
                {
                    comment: comment.trim(),
                    customerId: id,
                    type: 'follow_up'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setCommentSaved(true);
                setCommentDate(new Date().toISOString());

                setTimeout(() => {
                    setCommentSaved(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Error saving comment:', error);
            setError('Failed to save comment. Please try again.');

            // Fallback: Save to localStorage if API fails
            const commentsKey = `customer_comments_${id}`;
            const comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
            const newComment = {
                comment: comment.trim(),
                createdAt: new Date().toISOString(),
                type: 'follow_up'
            };
            comments.unshift(newComment);
            localStorage.setItem(commentsKey, JSON.stringify(comments));

            setCommentSaved(true);
            setCommentDate(newComment.createdAt);

            setTimeout(() => {
                setCommentSaved(false);
            }, 3000);
        } finally {
            setSavingComment(false);
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-KE', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
            link.setAttribute('download', `statement_${customer?.customerId || id}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting statement:', error);
            setError('Failed to export statement. Please try again.');
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
                'http://localhost:5000/api/payments/stk-push',
                {
                    customerId: customer.id,
                    phoneNumber: paymentData.phoneNumber,
                    amount: parseFloat(paymentData.amount),
                    accountNumber: customer.accountNumber,
                    narration: `Loan repayment for ${customer.name}`
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
                    message: 'MPESA prompt sent successfully!',
                    checkoutId: response.data.data.checkoutId
                });

                pollPaymentStatus(response.data.data.checkoutId);
            } else {
                setMpesaStatus({
                    status: 'failed',
                    message: response.data.message || 'Failed to send MPESA prompt'
                });
            }
        } catch (error) {
            console.error('Error sending MPESA prompt:', error);
            setMpesaStatus({
                status: 'failed',
                message: error.response?.data?.message || 'Failed to send MPESA prompt. Please try again.'
            });
        } finally {
            setProcessingPayment(false);
        }
    };

    const pollPaymentStatus = async (checkoutId) => {
        try {
            const token = localStorage.getItem('token');
            let attempts = 0;
            const maxAttempts = 30;

            const interval = setInterval(async () => {
                attempts++;

                if (attempts > maxAttempts) {
                    clearInterval(interval);
                    setMpesaStatus({
                        status: 'failed',
                        message: 'Payment timeout. Please check with the customer.'
                    });
                    return;
                }

                const response = await axios.get(
                    `http://localhost:5000/api/payments/status/${checkoutId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    const status = response.data.data.status;

                    if (status === 'success' || status === 'completed') {
                        clearInterval(interval);
                        setMpesaStatus({
                            status: 'success',
                            message: 'Payment completed successfully!',
                            checkoutId: checkoutId
                        });

                        fetchCustomerDetails();
                        fetchCustomerTransactions();

                        setTimeout(() => {
                            setShowPaymentModal(false);
                            setMpesaStatus(null);
                        }, 5000);
                    } else if (status === 'failed' || status === 'cancelled') {
                        clearInterval(interval);
                        setMpesaStatus({
                            status: 'failed',
                            message: response.data.data.message || 'Payment failed or was cancelled'
                        });
                    }
                }
            }, 3000);

        } catch (error) {
            console.error('Error polling payment status:', error);
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
                    onClick={fetchCustomerDetails}
                >
                    Retry
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
                                {customer?.customerId || id}
                            </Typography>
                        </Box>
                    </div>

                    <div className="customer-details-actions">
                        <button
                            className="customer-details-action-btn"
                            onClick={handleExportStatement}
                        >
                            <Download sx={{ fontSize: 16 }} />
                            Export
                        </button>
                        <button
                            className="customer-details-primary-btn"
                            onClick={handleProcessPayment}
                        >
                            <Payment sx={{ fontSize: 16 }} />
                            Process Payment
                        </button>
                    </div>
                </div>
            </Box>

            {/* Main Content - Updated Layout */}
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
                                    <div className="info-label">Loan Type</div>
                                    <div className="info-value">{customer?.loanType || 'Standard Loan'}</div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Last Payment Date</div>
                                    <div className="info-value">
                                        {customer?.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'No payments'}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Last Payment Amount</div>
                                    <div className="info-value amount success">
                                        {customer?.lastPaymentAmount ? formatCurrency(customer.lastPaymentAmount) : 'N/A'}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">Next Due Date</div>
                                    <div className="info-value">
                                        {customer?.nextDueDate ? formatDate(customer.nextDueDate) : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Comment Section (35%) & Recent Transactions (65%) */}
                <div className="bottom-row-cards">
                    {/* Customer Follow-up Comments Card - 35% width */}
                    <div className="details-card comment-card">
                        <div className="card-header">
                            <Typography className="card-title">
                                <Comment sx={{ fontSize: 16, marginRight: '0.5rem' }} />
                                Customer Follow-up
                            </Typography>
                        </div>

                        <div className="card-body">
                            <textarea
                                className="comment-textarea"
                                placeholder="Add notes about customer follow-up, payment promises, or reasons for non-payment. This will be included in reports..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows="6"
                            />

                            <div className="comment-actions">
                                {commentDate && (
                                    <div className="comment-date">
                                        Last updated: {formatDate(commentDate)}
                                    </div>
                                )}

                                <button
                                    className="comment-save-btn"
                                    onClick={saveComment}
                                    disabled={savingComment || !comment.trim()}
                                >
                                    {savingComment ? 'Saving...' : commentSaved ? '✓ Saved' : 'Save Feedback'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions Card - 65% width */}
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
                                        No transactions found
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
                                            <tr key={transaction.id}>
                                                <td>{formatDate(transaction.createdAt)}</td>
                                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {transaction.description}
                                                </td>
                                                <td className={`transaction-amount ${transaction.type === 'credit' ? 'credit' : 'debit'}`}>
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td>
                                                    <span className={`transaction-status ${transaction.status}`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                                <td>{transaction.type}</td>
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
                                Process MPESA Payment
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
                                        Full: {formatCurrency(customer?.loanBalance)}
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
                                            ID: {mpesaStatus.checkoutId}
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
                                {processingPayment ? 'Sending...' : 'Send MPESA Prompt'}
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
                                <img
                                    src="/images/mpesa-logo2.png"
                                    alt="MPESA"
                                    className="mpesa-logo-image"
                                    onError={(e) => {
                                        // If image fails to load, show text fallback
                                        e.target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                color: #007C00;
                padding: 10px;
              `;
                                        fallback.textContent = 'MPESA';
                                        e.target.parentNode.appendChild(fallback);
                                    }}
                                />
                            </div>
                            <Typography className="confirmation-modal-title">
                                Confirm MPESA Payment
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
                                <strong>Note:</strong> Customer will receive an MPESA prompt on their phone and must enter their PIN to complete the payment.
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
                                Send Prompt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    );
};

export default CustomerDetails;