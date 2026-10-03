import axios from 'axios';

// The only place that knows the backend URL. Never hard-code it -
// it comes from the VITE_ prefixed env var, which is the only kind of
// env var Vite exposes to the browser.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

// Attach the JWT (if present) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartcart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors so components can show a friendly message without
// needing to know about axios response shapes.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.request ? 'Cannot reach the server. Please try again.' : error.message);

    if (error.response?.status === 401) {
      // Token expired/invalid - clear local session so the UI reflects it.
      localStorage.removeItem('smartcart_token');
      localStorage.removeItem('smartcart_user');
    }

    return Promise.reject({ ...error, friendlyMessage: message });
  }
);

// --- Auth ---
export const registerUser = (email) => api.post('/auth/register', { email });
export const verifyOtpRequest = (email, otp) => api.post('/auth/verify-otp', { email, otp });
export const resendOtpRequest = (email) => api.post('/auth/resend-otp', { email });
// Authorized by the short-lived registrationToken from verify-otp, NOT by
// whatever (nonexistent, at this point) session token is in localStorage -
// pass it explicitly so the request interceptor's normal token doesn't
// get in the way (there isn't one yet; this user isn't logged in).
export const completeRegistrationRequest = (registrationToken, payload) =>
  api.post('/auth/complete-registration', payload, {
    headers: { Authorization: `Bearer ${registrationToken}` },
  });
export const loginUser = (payload) => api.post('/auth/login', payload);
export const fetchMe = () => api.get('/auth/me');

// --- Products ---
export const fetchProducts = (params) => api.get('/products', { params });
export const fetchProductById = (id) => api.get(`/products/${id}`);
export const fetchFilterOptions = () => api.get('/products/meta/filters');
export const createProduct = (payload) => api.post('/products', payload);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// --- AI ---
export const aiSearch = (query) => api.post('/ai/search', { query });
export const aiExplain = (productId, requirements) =>
  api.post('/ai/explain', { productId, requirements });
export const aiCompare = (productIds) => api.post('/ai/compare', { productIds });

// --- Wishlist ---
export const fetchWishlist = () => api.get('/wishlist');
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);

// --- Search history ---
export const fetchSearchHistory = () => api.get('/search-history');

// --- Chat ---
export const sendChatMessage = (message) => api.post('/chat', { message });

export default api;
