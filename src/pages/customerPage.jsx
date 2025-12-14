// src/pages/customerPage.jsx - Create this file if missing
import React from 'react';
import { Box, Typography, Paper, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const CustomerPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#5c4730' }}>
          Customer Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            backgroundColor: '#5c4730',
            '&:hover': { backgroundColor: '#3c2a1c' }
          }}
        >
          Add Customer
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e8e8e8' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#5c4730' }}>
          All Customers
        </Typography>
        <Typography color="textSecondary">
          Customer list will be displayed here. This page is under development.
        </Typography>
      </Paper>
    </Container>
  );
};

export default CustomerPage; // Make sure this line exists