import axios from 'axios';
import { authStorage } from '../utils/authStorage';

// Base URL trỏ về API Spring Boot Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;
    
    if (status === 401) {
      console.warn('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
      if (authStorage.getToken()) {
        authStorage.clearAuth();
      }
    }

    const errorMessage = responseData?.message || error.message || 'Có lỗi xảy ra khi kết nối máy chủ';
    
    const enhancedError = new Error(errorMessage);
    enhancedError.status = status;
    enhancedError.data = responseData?.data || null;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default axiosInstance;
