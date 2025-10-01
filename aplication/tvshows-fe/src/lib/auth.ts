import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type User = {
  id: string;
  email: string;
  displayName?: string | null;
  isAdmin?: boolean;
  emailVerified?: boolean;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  expiresAtUtc: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const KEY_TOK = "access_token";
const KEY_EXP = "access_token_expires";
const KEY_USR = "auth_user";

const AuthContext = createContext<AuthCtx | null>(null);

function loadSession() {
  const t = sessionStorage.getItem(KEY_TOK);
  const exp = sessionStorage.getItem(KEY_EXP);
  const uStr = sessionStorage.getItem(KEY_USR);
  let u: User | null = null;
  try { u = uStr ? JSON.parse(uStr) : null; } catch {}
  return { t, exp, u };
}
function persistSession(t: string | null, exp: string | null, u: User | null) {
  if (t && exp && u) {
    sessionStorage.setItem(KEY_TOK, t);
    sessionStorage.setItem(KEY_EXP, exp);
    sessionStorage.setItem(KEY_USR, JSON.stringify(u));
  } else {
    sessionStorage.removeItem(KEY_TOK);
    sessionStorage.removeItem(KEY_EXP);
    sessionStorage.removeItem(KEY_USR);
  }
}
function isExpired(expUtc: string | null) {
  if (!expUtc) return true;
  return Date.now() >= new Date(expUtc).getTime();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAtUtc, setExpiresAtUtc] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const timerRef = useRef<number | null>(null);

  const isAuthenticated = !!token && !!user && !isExpired(expiresAtUtc);
  const isVerified = !!user?.emailVerified && isAuthenticated;

  function clearTimer() {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
  }
  function scheduleExpiry(expUtc: string | null) {
    clearTimer();
    if (!expUtc) return;
    const ms = new Date(expUtc).getTime() - Date.now();
    if (ms <= 0) {
      setToken(null); setExpiresAtUtc(null); setUser(null);
      persistSession(null, null, null);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setToken(null); setExpiresAtUtc(null); setUser(null);
      persistSession(null, null, null);
    }, ms);
  }

  useEffect(() => {
    const { t, exp, u } = loadSession();
    if (t && exp && u && !isExpired(exp)) {
      setToken(t); setExpiresAtUtc(exp); setUser(u);
      scheduleExpiry(exp);
    }
    return clearTimer;
  }, []);

  useEffect(() => {
    const onStorage = () => {
      const { t, exp, u } = loadSession();
      setToken(t ?? null);
      setExpiresAtUtc(exp ?? null);
      setUser(u ?? null);
      scheduleExpiry(exp ?? null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(email: string, password: string) {
    const API = import.meta.env.VITE_API_URL ?? "http://localhost:30120";
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Email: email, Password: password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = res.status === 401
        ? "Credenciais inválidas."
        : (data.error || data.detail || "Erro no login.");
      throw new Error(msg);
    }
    const data = await res.json();
    setToken(data.accessToken);
    setExpiresAtUtc(data.expiresAtUtc);
    setUser(data.user);
    persistSession(data.accessToken, data.expiresAtUtc, data.user);
    scheduleExpiry(data.expiresAtUtc);
  }

  function logout() {
    setToken(null);
    setExpiresAtUtc(null);
    setUser(null);
    persistSession(null, null, null);
    clearTimer();
  }

  const value = useMemo<AuthCtx>(() => ({
    user, token, isAuthenticated, isVerified, expiresAtUtc, login, logout
  }), [user, token, isAuthenticated, isVerified, expiresAtUtc]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
