"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ROOT PAGE  —  app/page.tsx
// Consumes auth from <AuthProvider/> (lib/auth.tsx); owns module/page/toast state.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Module, ToastState } from "../types";
import { globalCss, errMsg } from "../lib/utils";
import { Toast } from "../components/ui";
import { useAuth } from "../lib/auth";
import LoginPage      from "../components/LoginPage";
import HomePage       from "../components/HomePage";
import CommitmentPage from "../components/CommitmentPage";

// Internal route → component key mapping
type PageKey = "home" | "commitment";

function resolveRoute(url: string): PageKey | null {
  const map: Record<string, PageKey> = {
    "/commitment": "commitment",
    "commitment":  "commitment",
  };
  return map[url] ?? null;
}

export default function RootPage() {
  const {
    baseUrl, setBaseUrl, token, user, api, login, logout,
    sessionExpired, clearSessionExpired,
  } = useAuth();

  const [modules, setModules] = useState<Module[]>([]);
  const [modLoad, setModLoad] = useState(false);
  const [page,    setPage]    = useState<PageKey>("home");
  const [toast,   setToast]   = useState<ToastState>(null);

  const notify = (msg: string, type: "ok" | "err" = "ok") => setToast({ msg, type });

  // Load modules whenever auth context becomes (un)authenticated
  useEffect(() => {
    if (!token) { setModules([]); return; }
    let cancelled = false;
    setModLoad(true);
    (async () => {
      try {
        const res = await api.getModules();
        if (!cancelled) setModules((res.data || []) as Module[]);
      } catch (e) {
        if (!cancelled) notify("Failed to load: " + errMsg(e), "err");
      } finally {
        if (!cancelled) setModLoad(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, api]);

  // Auto-logout from 401/403: surface a toast + ensure we're on the home route.
  useEffect(() => {
    if (!sessionExpired) return;
    notify("Session expired. Please log in again.", "err");
    setPage("home");
    clearSessionExpired();
  }, [sessionExpired, clearSessionExpired]);

  const handleLogout = async () => {
    await logout();
    setPage("home");
    notify("Signed out");
  };

  const handleNavigate = (url: string) => {
    const route = resolveRoute(url);
    if (route) {
      setPage(route);
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <>
      <style>{globalCss}</style>

      {!token && (
        <LoginPage
          onLogin={login}
          baseUrl={baseUrl}
          setBaseUrl={setBaseUrl}
        />
      )}

      {token && page === "home" && (
        <HomePage
          user={user}
          modules={modules}
          loading={modLoad}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {token && page === "commitment" && (
        <CommitmentPage api={api} onBack={() => setPage("home")} />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </>
  );
}