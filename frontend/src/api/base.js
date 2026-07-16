import axios from 'axios';
import { API_BASE_URL } from '../config/endpoints';

const PUBLIC_AUTH_PATHS = new Set(['/auth/login', '/auth/register']);

const getRequestPath = (requestUrl = '') => {
  try {
    return new URL(requestUrl, API_BASE_URL).pathname;
  } catch {
    return requestUrl;
  }
};

export const shouldHandleUnauthorized = (error) => {
  if (error.response?.status !== 401) return false;

  const requestPath = getRequestPath(error.config?.url);
  if (PUBLIC_AUTH_PATHS.has(requestPath)) return false;

  const headers = error.config?.headers;
  const authorization = headers?.Authorization
    || headers?.authorization
    || headers?.get?.('Authorization');

  return Boolean(authorization);
};

// Base API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldHandleUnauthorized(error)) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
