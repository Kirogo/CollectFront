// src/components/common/CustomerTable.jsx - CORRECTED
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
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Edit,
  Phone,
  AccountBalanceWallet,
  CalendarToday
} from '@mui/icons-material';

const CustomerTable = ({ customers = [], loading = false, onEdit }) => {
  const navigate = useNavigate();
  
  // State declarations - ONLY ONCE
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // Show 25 rows initially
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('createdAt'); // Sort by creation date
  const [order, setOrder] = useState('desc'); // Descending order (newest first)

  // Filter and sort customers - FIXED VERSION
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber?.includes(searchTerm) ||
      customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let aValue, bValue;
      
      // Handle different sort types
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
  }, [filteredCustomers, orderBy, order]);

  // Pagination
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

  // Handle view customer
  const handleViewCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    if (onEdit) {
      onEdit(customer);
    } else {
      navigate(`/customers/edit/${customer.id}`);
    }
  };

  // Table columns - added createdAt column
  const columns = [
    { id: 'customerId', label: 'ArrearsID', minWidth: 120 },
    { id: 'name', label: 'Customer Name', minWidth: 180 },
    { id: 'phoneNumber', label: 'Phone No', minWidth: 140 },
    { id: 'accountNumber', label: 'Account No', minWidth: 150 },
    { id: 'loanBalance', label: 'Loan Balance', minWidth: 140, align: 'center' },
    { id: 'arrears', label: 'Arrears', minWidth: 120, align: 'left' },
    { id: 'lastPaymentDate', label: 'Last Payment', minWidth: 120 },
    { id: 'status', label: 'Status', minWidth: 100 },
    { id: 'actions', label: 'Actions', minWidth: 120, align: 'center' }
  ];

  // Format currency
  const formatCurrency = (amount) => {
    return `KES ${parseFloat(amount || 0).toLocaleString('en-KE')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e8e8e8' }}>
        <Typography>Loading customers...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      borderRadius: 3, 
      border: '1px solid #e8e8e8',
      boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)',
      overflow: 'hidden'
    }}>
      {/* Table Header with Search */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#f8f9fa'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#5c4730' }}>
            Customers
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search customers..."
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
            <Tooltip title="Filter">
              <IconButton sx={{ 
                border: '1px solid #e8e8e8',
                borderRadius: 2,
                backgroundColor: 'white'
              }}>
                <FilterList />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet sx={{ color: '#5c4730', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#666' }}>
              Total Portfolio: <strong style={{ color: '#5c4730' }}>
                {formatCurrency(customers.reduce((sum, c) => sum + parseFloat(c.loanBalance || 0), 0))}
              </strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            <Typography variant="body2" sx={{ color: '#666' }}>
              Total Customers: <strong style={{ color: '#5c4730' }}>
                {customers.filter(c => c.isActive).length}
              </strong>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f0ea' }}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#5c4730',
                    borderBottom: '2px solid #d4a762'
                  }}
                >
                  {column.id !== 'actions' && column.id !== 'status' ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={{ display: 'none' }}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
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
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {searchTerm ? 'No customers found matching your search' : 'No customers available'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  hover
                  sx={{ 
                    '&:hover': { backgroundColor: '#faf6f0' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell sx={{ color: '#5c4730', fontWeight: 500 }}>
                    {customer.customerId}
                  </TableCell>
                  <TableCell sx={{ color: '#5c4730', fontWeight: 500 }}>
                    {customer.name}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {customer.phoneNumber}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#666' }}>
                    {customer.accountNumber}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#5c4730' }}>
                    {formatCurrency(customer.loanBalance)}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={formatCurrency(customer.arrears)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(customer.arrears) === 'success' ? '#ecfdf5' :
                                        getStatusColor(customer.arrears) === 'warning' ? '#fffbeb' : '#fef2f2',
                        color: getStatusColor(customer.arrears) === 'success' ? '#059669' :
                              getStatusColor(customer.arrears) === 'warning' ? '#d97706' : '#dc2626',
                        fontWeight: 500,
                        minWidth: 100
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#666', fontSize: '14px' }}>
                    {formatDate(customer.lastPaymentDate)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(customer.arrears)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(customer.arrears) === 'success' ? '#ecfdf5' :
                                        getStatusColor(customer.arrears) === 'warning' ? '#fffbeb' : '#fef2f2',
                        color: getStatusColor(customer.arrears) === 'success' ? '#059669' :
                              getStatusColor(customer.arrears) === 'warning' ? '#d97706' : '#dc2626',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCustomer(customer)}
                          sx={{
                            color: '#5c4730',
                            backgroundColor: '#f5f0ea',
                            '&:hover': { backgroundColor: '#e8dfd1' }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredCustomers.length}
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
  );
};

export default CustomerTable;