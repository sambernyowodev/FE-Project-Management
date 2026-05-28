import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const method = error.config?.method?.toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Terjadi kesalahan saat memproses permintaan';
        
      // Throw exception for POST, PUT, DELETE
      throw new Error(errorMessage);
    }

    return Promise.reject(error);
  }
);
