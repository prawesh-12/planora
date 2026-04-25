/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getMe, login as loginApi, register as registerApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("token")),
  );

  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeOrgId");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setUser(null);
      return null;
    }

    const res = await getMe();
    setUser(res.data.user);

    return res.data.user;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await getMe();

        if (isMounted) {
          setUser(res.data.user);
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("activeOrgId");

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback(async (credentials) => {
    const res = await loginApi(credentials);

    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);

    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerApi(data);

    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);

    return res.data;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
