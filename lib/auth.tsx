"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT  —  owns baseUrl, tokens, api client, and auth actions
// ─────────────────────────────────────────────────────────────────────────────
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { DirectusUser } from "../types";
import { ApiClient, DEFAULT_BASE_URL, makeApi } from "../API/api";

interface AuthContextValue {
  baseUrl: string;
  setBaseUrl: (u: string) => void;
  token: string | null;
  user: DirectusUser | null;
  api: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Set to true when the server returns 401/403 and we auto-clear the session.
  // Consumers should show feedback and call clearSessionExpired() to reset it.
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_BASE    = "directus_url";
const LS_ACCESS  = "d_token";
const LS_REFRESH = "d_refresh";

interface LoginResponse {
  data: { access_token: string; refresh_token: string; expires: number };
}
interface MeResponse { data: DirectusUser }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [baseUrl,        setBaseUrlState]   = useState<string>(DEFAULT_BASE_URL);
  const [token,          setToken]          = useState<string | null>(null);
  const [refreshToken,   setRefreshToken]   = useState<string | null>(null);
  const [user,           setUser]           = useState<DirectusUser | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Hydrate from localStorage on mount (client-only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const b = window.localStorage.getItem(LS_BASE);
    const a = window.localStorage.getItem(LS_ACCESS);
    const r = window.localStorage.getItem(LS_REFRESH);
    if (b) setBaseUrlState(b);
    if (a) setToken(a);
    if (r) setRefreshToken(r);
  }, []);

  const setBaseUrl = useCallback((u: string) => {
    const clean = u.replace(/\/$/, "");
    setBaseUrlState(clean);
    if (typeof window !== "undefined") window.localStorage.setItem(LS_BASE, clean);
  }, []);

  // Local-only teardown: clears tokens/user without hitting the server.
  // Used as the unauthorized handler so a 401 doesn't cause a logout->401 loop.
  // Flips sessionExpired so the UI can surface "session expired" feedback.
  const forceLogout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_ACCESS);
      window.localStorage.removeItem(LS_REFRESH);
    }
    setSessionExpired(true);
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const api = useMemo<ApiClient>(
    () => makeApi(baseUrl, token, { onUnauthorized: forceLogout }),
    [baseUrl, token, forceLogout]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = (await api.login(email, password)) as LoginResponse;
      const access  = res?.data?.access_token  ?? null;
      const refresh = res?.data?.refresh_token ?? null;
      setToken(access);
      setRefreshToken(refresh);
      setSessionExpired(false);
      if (typeof window !== "undefined") {
        if (access)  window.localStorage.setItem(LS_ACCESS,  access);
        if (refresh) window.localStorage.setItem(LS_REFRESH, refresh);
      }
    },
    [api]
  );

  // Refresh current user whenever the access token changes.
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = (await api.me()) as MeResponse;
        if (!cancelled) setUser(res?.data ?? null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, api]);

  const logout = useCallback(async () => {
    try { await api.logout(refreshToken); } catch { /* ignore */ }
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_ACCESS);
      window.localStorage.removeItem(LS_REFRESH);
    }
  }, [api, refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ baseUrl, setBaseUrl, token, user, api, login, logout, sessionExpired, clearSessionExpired }),
    [baseUrl, setBaseUrl, token, user, api, login, logout, sessionExpired, clearSessionExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
