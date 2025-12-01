import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// AUTH APIs
// ==============================
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
  changePassword: (passwordData) => api.put("/auth/password", passwordData),
  deleteAccount: () => api.delete("/auth/account"),
};

// ==============================
// PHARMACY APIs
// ==============================
export const pharmacyAPI = {
  getAll: (params) => api.get("/pharmacies", { params }),
  getFeatured: () => api.get("/pharmacies/featured"),
  getById: (id) => api.get(`/pharmacies/${id}`),
  update: (id, data) => api.put(`/pharmacies/${id}`, data),
  updateWorkingHours: (id, workingHours) =>
    api.put(`/pharmacies/${id}/working-hours`, { workingHours }),
  getReviews: (id) => api.get(`/pharmacies/${id}/reviews`),
};

// ==============================
// MEDICATION APIs
// ==============================
export const medicationAPI = {
  getAll: (params) => api.get("/medications", { params }),
  getById: (id) => api.get(`/medications/${id}`),
  getTopSearched: () => api.get("/medications/top-searched"),
  getByCategory: (category, params) =>
    api.get(`/medications/category/${category}`, { params }),
  create: (data) => api.post("/medications", data),
  update: (id, data) => api.put(`/medications/${id}`, data),
  delete: (id) => api.delete(`/medications/${id}`),
};

// ==============================
// ORDER APIs
// ==============================
export const orderAPI = {
  getAll: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post("/orders", orderData),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
  getMostOrderedForPharmacy: (pharmacyId) =>
    api.get(`/orders/pharmacy/${pharmacyId}/most-ordered`),
};

// ==============================
// USER APIs (FULLY FIXED)
// ==============================
export const userAPI = {
  // Profile
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (id, data) => api.put(`/users/${id}`, data),

  // ------------------------------
  // FAVORITE PRODUCTS (ITEMS)
  // ------------------------------
  getFavoriteItems: (id) =>
    api.get(`/users/${id}/favorite-items`),

  addFavoriteItem: (id, itemId) =>
    api.post(`/users/${id}/favorite-items/${itemId}`),

  removeFavoriteItem: (id, itemId) =>
    api.delete(`/users/${id}/favorite-items/${itemId}`),

  // ------------------------------
  // FAVORITE PHARMACIES
  // ------------------------------
  getFavoritePharmacies: (id) =>
    api.get(`/users/${id}/favorite-pharmacies`),

  addFavoritePharmacy: (id, pharmacyId) =>
    api.post(`/users/${id}/favorite-pharmacies/${pharmacyId}`),

  removeFavoritePharmacy: (id, pharmacyId) =>
    api.delete(`/users/${id}/favorite-pharmacies/${pharmacyId}`),
};

// ==============================
// REVIEW APIs
// ==============================
export const reviewAPI = {
  getAll: (params) => api.get("/reviews", { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  create: (reviewData) => api.post("/reviews", reviewData),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getByPharmacy: (pharmacyId) => api.get(`/reviews/pharmacy/${pharmacyId}`),
  getByUser: (userId) => api.get(`/reviews/user/${userId}`),
};

// ==============================
// INVENTORY APIs
// ==============================
export const inventoryAPI = {
  getAll: (params) => api.get("/inventory", { params }),
  add: (inventoryData) => api.post("/inventory", inventoryData),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

export default api;
