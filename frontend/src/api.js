import axios from 'axios';

// Backend URL - environment variable kullan
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://fifa-tournament-backend.onrender.com';

console.log('Environment:', process.env.NODE_ENV);
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

// Test: Force check if baseURL is working
console.log('Axios instance baseURL:', api.defaults.baseURL);

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request Details:', {
      method: config.method && config.method.toUpperCase(),
      baseURL: config.baseURL,
      url: config.url,
      fullURL: config.baseURL + config.url
    });
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    const method = response.config && response.config.method && response.config.method.toUpperCase();
    const url = response.config && response.config.url;
    console.log('API Response:', method, url, response.status);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config && error.config.url,
      method: error.config && error.config.method,
      status: error.response && error.response.status,
      message: error.message,
      data: error.response && error.response.data
    });
    
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin';
    }
    
    return Promise.reject(error);
  }
);

export default api;
