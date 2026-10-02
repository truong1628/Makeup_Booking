import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '../utils/authStorage';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(true);

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
      }}
    >
      {children}
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
