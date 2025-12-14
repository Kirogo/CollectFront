// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import CustomerList from '../components/Customers/CustomerList';
import STKPushForm from '../components/Payments/STKPushForm';
import authService from '../services/auth.service';
import customerService from '../services/customer.service';
import stkService from '../services/stk.service';
import { SAMPLE_CUSTOMERS } from '../utils/constants';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stkStatus, setStkStatus] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setUser(currentUser);
    loadCustomers();
  }, [navigate]);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await customerService.getAllCustomers();
      
      if (result.success) {
        setCustomers(result.data.length > 0 ? result.data : SAMPLE_CUSTOMERS);
      } else {
        setError(result.message || 'Failed to load customers');
        setCustomers(SAMPLE_CUSTOMERS); // Fallback to sample data
      }
    } catch (err) {
      setError('Connection error. Using sample data.');
      setCustomers(SAMPLE_CUSTOMERS); // Fallback to sample data
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      loadCustomers();
      return;
    }
    
    setLoading(true);
    try {
      const result = await customerService.searchCustomers(query);
      
      if (result.success) {
        setCustomers(result.data);
      } else {
        setError(result.message || 'Search failed');
      }
    } catch (err) {
      setError('Search error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async (paymentData) => {
    setProcessingPayment(true);
    setError('');
    setStkStatus({ status: 'initiating', message: 'Initiating STK Push...' });
    
    try {
      const result = await stkService.initiateSTKPush(paymentData);
      
      if (result.success) {
        setStkStatus({
          status: 'pending',
          message: 'STK Push sent! Ask customer to check their phone and enter MPesa PIN',
          checkoutId: result.checkoutId,
        });
        
        // Start polling for status
        if (result.checkoutId) {
          pollPaymentStatus(result.checkoutId);
        }
      } else {
        setStkStatus({ status: 'failed', message: result.message });
        setError(result.message);
      }
    } catch (err) {
      const errorMsg = 'Failed to initiate payment. Please try again.';
      setStkStatus({ status: 'failed', message: errorMsg });
      setError(errorMsg);
      console.error('Payment error:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const pollPaymentStatus = async (transactionId) => {
    let attempts = 0;
    const maxAttempts = 20;
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setStkStatus({
          status: 'timeout',
          message: 'Payment status check timeout. Please verify manually.',
        });
        return;
      }
      
      attempts++;
      
      try {
        const result = await stkService.checkSTKStatus(transactionId);
        
        if (result.success) {
          const status = result.data.transaction?.status || result.data.status;
          
          if (status === 'completed' || status === 'success') {
            setStkStatus({
              status: 'completed',
              message: '✅ Payment successful! Loan has been updated.',
            });
            
            // Refresh customer data
            await loadCustomers();
            
            // Reset after successful payment
            setTimeout(() => {
              setSelectedCustomer(null);
              setStkStatus(null);
            }, 3000);
          } else if (status === 'failed' || status === 'cancelled') {
            setStkStatus({
              status: 'failed',
              message: `Payment ${status}. Please try again.`,
            });
          } else {
            // Still pending, check again
            setTimeout(checkStatus, 3000);
          }
        }
      } catch (err) {
        console.error('Status check error:', err);
        setTimeout(checkStatus, 3000);
      }
    };
    
    setTimeout(checkStatus, 3000);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <div className="main-content">
        <Header
          title="STK Push Loan Repayment"
          subtitle="Initiate MPesa payment requests directly to customers"
          onSearch={handleSearch}
          searchPlaceholder="Search by name, phone, or account..."
        />
        
        {error && !stkStatus && (
          <div className="error-banner">{error}</div>
        )}
        
        {selectedCustomer ? (
          <STKPushForm
            customer={selectedCustomer}
            loading={processingPayment}
            error={error}
            stkStatus={stkStatus}
            onInitiatePayment={handleInitiatePayment}
            onBack={() => {
              setSelectedCustomer(null);
              setStkStatus(null);
              setError('');
            }}
          />
        ) : (
          <>
            <CustomerList
              customers={customers}
              loading={loading}
              error={error}
              onSelectCustomer={setSelectedCustomer}
              onRetry={loadCustomers}
            />
            
            {!loading && customers.length === 0 && (
              <div className="welcome-state">
                <div className="welcome-content">
                  <h3>Welcome to NCBA Collections STK Push System</h3>
                  <p>Select a customer from the list to initiate loan repayment via MPesa.</p>
                  
                  <div className="quick-actions">
                    <div className="action-card">
                      <div className="action-icon">🔍</div>
                      <h4>Quick Search</h4>
                      <p>Search customers by name, phone, or account number</p>
                    </div>
                    <div className="action-card">
                      <div className="action-icon">📱</div>
                      <h4>STK Push</h4>
                      <p>Send payment requests directly to customer phones</p>
                    </div>
                    <div className="action-card">
                      <div className="action-icon">💰</div>
                      <h4>Real-time Updates</h4>
                      <p>See loan balances update immediately after payment</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;