import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  useEffect(() => {
    const stored = tokenStore.get();
    if (!stored) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    api
      .get('/users/me')
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401) {
          tokenStore.clear();
          setToken(null);
        }
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const startSession = useCallback((res) => {
    tokenStore.set(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const login = useCallback(
    async (email, password) => startSession(await api.post('/auth/login', { email, password })),
    [startSession]
  );

  const register = useCallback(
    async ({ name, email, password, interests }) =>
      startSession(await api.post('/auth/register', { name, email, password, interests })),
    [startSession]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user ? user.role : null,
      loading,
      login,
      register,
      logout,
      setUser,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
