import axiosInstance from './axiosInstance';
import { authStorage } from '../utils/authStorage';

export const authService = {
  async login(credentials) {
    const response = await axiosInstance.post('/api/v1/auth/login', credentials);
    if (response?.data?.token) {
      authStorage.setToken(response.data.token);
      authStorage.setUser(response.data);
    }
    return response.data;
  },

  async register(registerData) {
    const response = await axiosInstance.post('/api/v1/auth/register', registerData);
    return response.data;
  },

  logout() {
    authStorage.clearAuth();
    window.location.href = '/login';
  },

  getCurrentUser() {
    return authStorage.getUser();
  },

  isAuthenticated() {
    return authStorage.isAuthenticated();
  }
};
