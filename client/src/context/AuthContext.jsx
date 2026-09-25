import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Persist/clear token in localStorage and Axios headers
  const applyToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      localStorage.removeItem('token');
      delete API.defaults.headers.common['Authorization'];
    }
    setToken(newToken);
  }, []);

  // Restore session on mount from stored token
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem('token');
      if (!stored) {
        setLoading(false);
        return;
      }
      API.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
      try {
        const res = await API.get('/auth/me');
        setUser(res.data.user);
        setToken(stored);
      } catch {
        // Token invalid/expired — clean up
        applyToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [applyToken]);

  const register = async ({ name, email, password }) => {
    setError(null);
    const res = await API.post('/auth/register', { name, email, password });
    applyToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const login = async ({ email, password }) => {
    setError(null);
    const res = await API.post('/auth/login', { email, password });
    applyToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = useCallback(() => {
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
