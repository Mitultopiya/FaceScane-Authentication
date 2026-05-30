import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = (userData, accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        const response = await authService.getProfile();
        const profileUser = response.data.data.user;
        setUser(profileUser);
        localStorage.setItem('user', JSON.stringify(profileUser));
      } catch {
        clearAuth();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { user: userData, accessToken } = response.data.data;
    saveAuth(userData, accessToken);
    return userData;
  };

  const faceLogin = async (faceData) => {
    const response = await authService.faceLogin(faceData);
    const { user: userData, accessToken, matchAccuracy } = response.data.data;
    saveAuth(userData, accessToken);
    return { user: userData, matchAccuracy };
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    return response.data.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        faceLogin,
        register,
        logout,
        isAdmin,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
