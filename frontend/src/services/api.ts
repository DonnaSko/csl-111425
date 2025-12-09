import axios from 'axios';

// API URL from environment variable (set at build time)
// In production, this should be set to: https://your-backend.ondigitalocean.app/api
// Backend supports routes at both /api/auth and /auth, but we use /api prefix
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests and log requests for debugging
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData - let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  // Log API requests for debugging (only in development or when debugging)
  if (process.env.NODE_ENV === 'development' || localStorage.getItem('debug_api') === 'true') {
    console.log('[API REQUEST]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
  }
  
  return config;
});

// Handle 401 errors (unauthorized) and log responses for debugging
api.interceptors.response.use(
  (response) => {
    // Log successful API responses for debugging
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('debug_api') === 'true') {
      console.log('[API RESPONSE SUCCESS]', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        statusText: response.statusText
      });
    }
    return response;
  },
  (error) => {
    // Log API errors for debugging
    const errorLog = {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    };
    
    console.error('[API RESPONSE ERROR]', errorLog);
    
    if (error.response?.status === 401) {
      console.error('[API] Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
      console.error('[API] Subscription required - redirecting to subscription page');
      window.location.href = '/subscription';
    }
    return Promise.reject(error);
  }
);

export default api;

