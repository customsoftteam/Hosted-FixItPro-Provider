import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('fixitpro_token'));
  const [provider, setProvider] = useState(() => {
    const raw = localStorage.getItem('fixitpro_provider');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/providers/me');
        setProvider(data.provider);
        localStorage.setItem('fixitpro_provider', JSON.stringify(data.provider));
      } catch (error) {
        localStorage.removeItem('fixitpro_token');
        localStorage.removeItem('fixitpro_provider');
        setToken(null);
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const setAuth = (nextToken, nextProvider) => {
    localStorage.setItem('fixitpro_token', nextToken);
    localStorage.setItem('fixitpro_provider', JSON.stringify(nextProvider));
    setToken(nextToken);
    setProvider(nextProvider);
  };

  const refreshProfile = async () => {
    const { data } = await api.get('/providers/me');
    setProvider(data.provider);
    localStorage.setItem('fixitpro_provider', JSON.stringify(data.provider));
    return data.provider;
  };

  const logout = () => {
    localStorage.removeItem('fixitpro_token');
    localStorage.removeItem('fixitpro_provider');
    setToken(null);
    setProvider(null);
  };

  const value = useMemo(
    () => ({
      token,
      provider,
      loading,
      isAuthenticated: Boolean(token),
      setAuth,
      refreshProfile,
      logout,
    }),
    [token, provider, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
