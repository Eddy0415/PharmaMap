import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Pharmacy APIs
export const pharmacyAPI = {
  getAll: (params) => api.get('/pharmacies', { params }),
  getById: (id) => api.get(`/pharmacies/${id}`),
  getMedications: (id, params) => api.get(`/pharmacies/${id}/medications`, { params }),
  addReview: (id, reviewData) => api.post(`/pharmacies/${id}/reviews`, reviewData),
  update: (id, data) => api.put(`/pharmacies/${id}`, data),
};

// Medication APIs
export const medicationAPI = {
  getAll: (params) => api.get('/medications', { params }),
  search: (params) => api.get('/medications/search', { params }),
  getById: (id) => api.get(`/medications/${id}`),
  create: (data) => api.post('/medications', data),
  update: (id, data) => api.put(`/medications/${id}`, data),
  delete: (id) => api.delete(`/medications/${id}`),
  getPopular: () => api.get('/medications/popular/all'),
};

// Order APIs
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
};

// User APIs
export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (id, data) => api.put(`/users/${id}`, data),
  addAddress: (id, address) => api.post(`/users/${id}/addresses`, address),
  updateAddress: (id, addressId, data) => api.put(`/users/${id}/addresses/${addressId}`, data),
  deleteAddress: (id, addressId) => api.delete(`/users/${id}/addresses/${addressId}`),
  addFavorite: (id, pharmacyId) => api.post(`/users/${id}/favorites/${pharmacyId}`),
  removeFavorite: (id, pharmacyId) => api.delete(`/users/${id}/favorites/${pharmacyId}`),
  changePassword: (id, passwords) => api.put(`/users/${id}/password`, passwords),
};

export default api;


