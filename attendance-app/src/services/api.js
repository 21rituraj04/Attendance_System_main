import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE,
});

// Add token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('attendx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses globally (token expired)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && error.response?.data?.expired) {
      localStorage.removeItem('attendx_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
