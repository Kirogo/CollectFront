// src/services/customer.service.js
import api from './api';

const customerService = {
  // Get all customers
  getAllCustomers: async () => {
    try {
      const response = await api.get('/customers');
      return { success: true, data: response.customers || response.data || [] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Search customers
  searchCustomers: async (query) => {
    try {
      const response = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
      return { success: true, data: response.customers || [] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return { success: true, data: response.customer || response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Update customer
  updateCustomer: async (id, data) => {
    try {
      const response = await api.put(`/customers/${id}`, data);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

export default customerService;