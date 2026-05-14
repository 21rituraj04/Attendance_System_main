import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem('attendx_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem('attendx_token');
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('attendx_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('attendx_token');
    // Clear local cache
    ['att_sessions','att_attendance','att_students','att_subjects','att_subjects_full'].forEach(k => localStorage.removeItem(k));
    setUser(null);
  }, []);

  const value = { user, setUser, login, logout, loading, restoreSession };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
