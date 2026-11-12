import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authStorage } from '../utils/authStorage';
import { authService } from '../services/authService';
import LogoutConfirmModal from '../components/LogoutConfirmModal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState(null);

  useEffect(() => {
    const savedUser = authStorage.getUser();
    const savedToken = authStorage.getToken();
    if (savedToken && savedUser) {
      setUser(savedUser);
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data);
    setToken(data.token);
    return data;
  };

  const register = async (registerData) => {
    const data = await authService.register(registerData);
    return data;
  };

  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
    setToken(null);
  };

  const requestLogout = useCallback((onConfirmed) => {
    setLogoutCallback(() => onConfirmed || null);
    setShowLogoutModal(true);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    authStorage.clearAuth();
    setUser(null);
    setToken(null);
    setShowLogoutModal(false);
    if (typeof logoutCallback === 'function') {
      logoutCallback();
    }
    setLogoutCallback(null);
  }, [logoutCallback]);

  const handleCancelLogout = useCallback(() => {
    setShowLogoutModal(false);
    setLogoutCallback(null);
  }, []);

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    authStorage.setUser(updated);
    return updated;
  };

  const isAuthenticated = authStorage.isAuthenticated();
  const currentRole = authStorage.getRole();
  const isAdmin = currentRole === 'ROLE_ADMIN';
  const isArtist = currentRole === 'ROLE_ARTIST';
  const isCustomer = currentRole === 'ROLE_CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isArtist,
        isCustomer,
        login,
        register,
        logout,
        requestLogout,
        updateUser,
      }}
    >
      {children}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
