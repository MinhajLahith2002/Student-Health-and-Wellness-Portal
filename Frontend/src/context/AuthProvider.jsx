import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { apiFetch } from '../lib/api';

const STORAGE_USER = 'campushealth_user';

function redirectPathForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'doctor':
      return '/doctor/dashboard';
    case 'pharmacist':
      return '/pharmacist/dashboard';
    case 'counselor':
      return '/mental-health';
    default:
      return '/dashboard';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [booting, setBooting] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem(STORAGE_USER);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const profile = await apiFetch('/users/profile');
        if (!cancelled && profile?._id) {
          const u = profile;
          const normalized = {
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            isVerified: u.isVerified,
          };
          setUser(normalized);
          localStorage.setItem(STORAGE_USER, JSON.stringify(normalized));
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
      setUser(data.user);
    }
    return { ...data, redirectTo: redirectPathForRole(data.user?.role) };
  }, []);

  const register = useCallback(async (payload) => {
    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };

    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
      setUser(data.user);
    }
    return { ...data, redirectTo: redirectPathForRole(data.user?.role) };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      redirectPathForRole,
    }),
    [user, token, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
