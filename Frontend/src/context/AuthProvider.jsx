import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { apiFetch } from '../lib/api';

const STORAGE_USER = 'campushealth_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function redirectPathForRole(role) {
  switch (role) {
    case 'student':
      return '/';
    case 'admin':
      return '/admin/dashboard';
    case 'doctor':
      return '/doctor/dashboard';
    case 'pharmacist':
      return '/pharmacist/dashboard';
    case 'counselor':
      return '/counselor/dashboard';
    default:
      return '/';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [booting, setBooting] = useState(() => !!localStorage.getItem('token') && !readStoredUser());

  const syncUser = useCallback((nextUser) => {
    if (!nextUser) {
      localStorage.removeItem(STORAGE_USER);
      setUser(null);
      return;
    }

    const normalized = {
      id: nextUser._id || nextUser.id,
      name: nextUser.name,
      email: nextUser.email,
      role: nextUser.role,
      isVerified: nextUser.isVerified,
      profileImage: nextUser.profileImage,
      specialty: nextUser.specialty,
      bio: nextUser.bio,
      experience: nextUser.experience,
      education: nextUser.education,
    };

    localStorage.setItem(STORAGE_USER, JSON.stringify(normalized));
    setUser(normalized);
  }, []);

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
    const shouldBlockRoute = !readStoredUser();

    (async () => {
      try {
        if (shouldBlockRoute) {
          setBooting(true);
        }
        const profile = await apiFetch('/users/profile');
        if (!cancelled && profile?._id) {
          syncUser(profile);
        }
      } catch (error) {
        if (!cancelled) {
          const authFailed = error?.status === 401 || error?.status === 403;

          // Keep the existing session on transient reload/network/backend issues.
          // Only clear auth state when the backend explicitly rejects the token.
          if (authFailed) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, logout, syncUser]);

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
      syncUser(data.user);
    }
    return { ...data, redirectTo: redirectPathForRole(data.user?.role) };
  }, [syncUser]);

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

    return data;
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
      syncUser,
      redirectPathForRole,
    }),
    [user, token, booting, login, register, logout, syncUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
