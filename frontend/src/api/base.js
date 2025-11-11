import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: '/api', // This will proxy to http://localhost:5000/api
});

// Add token to all requests
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

export default api;