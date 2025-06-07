import axios from 'axios';

// Create axios instance with nginx proxy configuration
const api = axios.create({
  baseURL: '/', // No need for localhost:5000 anymore - nginx handles routing
  withCredentials: true, // Important for cookie authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      console.log('Unauthorized access - please login');
    }
    return Promise.reject(error);
  }
);

export default api;
