// src/components/common/CustomerTable.jsx - FIXED
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  Phone
} from '@mui/icons-material';

const CustomerTable = ({ customers = [], loading = false }) => {
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      let aValue, bValue;
      
      if (orderBy === 'createdAt') {
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
      } else if (orderBy === 'loanBalance' || orderBy === 'arrears') {
        aValue = parseFloat(a[orderBy]) || 0;
        bValue = parseFloat(b[orderBy]) || 0;
      } else {
        aValue = a[orderBy] || '';
        bValue = b[orderBy] || '';
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, orderBy, order]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedCustomers.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedCustomers, page, rowsPerPage]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewCustomer = (customer) => {
    console.log('👁️ Viewing customer:', customer);
    console.log('Customer _id:', customer._id);
    console.log('Customer customerId:', customer.customerId);
    console.log('Customer id (legacy):', customer.id);
    
    // FIX: Use customer._id (MongoDB) instead of customer.id (JSON)
    const customerId = customer._id || customer.customerId || customer.id;
    console.log('Navigating with ID:', customerId);
    
    if (customerId) {
      navigate(`/customers/${customerId}`);
    } else {
      console.error('❌ No valid customer ID found:', customer);
      alert('Error: Customer ID not found');
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${parseFloat(amount || 0).toLocaleString('en-KE')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (arrears) => {
    const arrearsAmount = parseFloat(arrears || 0);
    if (arrearsAmount === 0) return 'success';
    if (arrearsAmount > 0 && arrearsAmount <= 1000) return 'warning';
    return 'error';
  };

  const getStatusText = (arrears) => {
    const arrearsAmount = parseFloat(arrears || 0);
    if (arrearsAmount === 0) return 'Current';
    if (arrearsAmount > 0 && arrearsAmount <= 1000) return 'Warning';
    return 'In Arrears';
  };

  const columns = [
    { id: 'customerId', label: 'ID', minWidth: 100 },
    { id: 'name', label: 'CUSTOMER NAME', minWidth: 200 },
    { id: 'phoneNumber', label: 'PHONE', minWidth: 130, align: 'center'  },
    { id: 'arrears', label: 'ARREARS', minWidth: 120, align: 'center' },
    { id: 'lastPaymentDate', label: 'LAST PAYMENT', minWidth: 120, align: 'center' },
    { id: 'status', label: 'STATUS', minWidth: 100 },
    { id: 'actions', label: 'INFO', minWidth: 100, align: 'center' }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading customers...</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ 
      width: '100%',
      overflow: 'hidden',
      borderRadius: '8px',
      border: '1px solid rgba(92, 71, 48, 0.08)',
      boxShadow: '0 2px 8px rgba(92, 71, 48, 0.05)'
    }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{ 
                    fontWeight: 700,
                    color: '#5c4730',
                    backgroundColor: '#f5f0ea',
                    borderBottom: '2px solid #d4a762',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '12px 16px'
                  }}
                >
                  {column.id !== 'actions' && column.id !== 'status' ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    No customers available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow 
                  key={customer._id || customer.id} // FIX: Use _id or id
                  hover
                  sx={{ 
                    '&:hover': { backgroundColor: '#faf6f0' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell sx={{ 
                    color: '#5c4730', 
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    padding: '12px 16px'
                  }}>
                    {customer.customerId}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#3c2a1c', 
                    fontWeight: 500,
                    padding: '12px 16px'
                  }}>
                    {customer.name}
                  </TableCell>
                  <TableCell sx={{ padding: '12px 16px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {customer.phoneNumber}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ padding: '12px 16px' }}>
                    <Chip
                      label={formatCurrency(customer.arrears)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(customer.arrears) === 'success' ? '#ecfdf5' :
                                        getStatusColor(customer.arrears) === 'warning' ? '#fffbeb' : '#fef2f2',
                        color: getStatusColor(customer.arrears) === 'success' ? '#059669' :
                              getStatusColor(customer.arrears) === 'warning' ? '#d97706' : '#dc2626',
                        fontWeight: 600,
                        fontSize: '12px',
                        minWidth: '100px'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#666', 
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '12px 16px'
                  }}>
                    {formatDate(customer.lastPaymentDate)}
                  </TableCell>
                  <TableCell sx={{ padding: '12px 16px' }}>
                    <Chip
                      label={getStatusText(customer.arrears)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(customer.arrears) === 'success' ? '#ecfdf5' :
                                        getStatusColor(customer.arrears) === 'warning' ? '#fffbeb' : '#fef2f2',
                        color: getStatusColor(customer.arrears) === 'success' ? '#059669' :
                              getStatusColor(customer.arrears) === 'warning' ? '#d97706' : '#dc2626',
                        fontWeight: 600,
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 16px' }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewCustomer(customer)}
                        sx={{
                          color: '#5c4730',
                          backgroundColor: '#f5f0ea',
                          '&:hover': { 
                            backgroundColor: '#e8dfd1'
                          }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={customers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: '1px solid rgba(92, 71, 48, 0.08)',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            color: '#666',
            fontSize: '13px'
          }
        }}
      />
    </Paper>
  );
};

export default CustomerTable;