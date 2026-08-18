import { createContext, useContext, useState, useCallback } from 'react';
import client, { getErrorMessage } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('arenax_user') || 'null');
    } catch {
      return null;
    }
  });

  const storeSession = useCallback(({ user: u, accessToken, refreshToken }) => {
    localStorage.setItem('arenax_access_token', accessToken);
    localStorage.setItem('arenax_refresh_token', refreshToken);
    localStorage.setItem('arenax_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const { data } = await client.post('/auth/login', credentials);
      storeSession(data.data);
      return data.data.user;
    },
    [storeSession],
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await client.post('/auth/register', payload);
      storeSession(data.data);
      return data.data.user;
    },
    [storeSession],
  );

  const logout = useCallback(async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem('arenax_access_token');
    localStorage.removeItem('arenax_refresh_token');
    localStorage.removeItem('arenax_user');
    setUser(null);
  }, []);

  const value = { user, login, register, logout, getErrorMessage };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};