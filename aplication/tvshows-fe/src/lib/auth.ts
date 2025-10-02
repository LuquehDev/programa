import React, { createContext, useContext, useEffect, useRef, useState } from "react";

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

function readSession() {
  const t = sessionStorage.getItem(KEY_TOK);
  const exp = sessionStorage.getItem(KEY_EXP);
  const uStr = sessionStorage.getItem(KEY_USR);
  let u: User | null = null;
  try {
    u = uStr ? JSON.parse(uStr) : null;
  } catch {
    u = null;
  }
  return { t, exp, u };
}

function writeSession(t: string | null, exp: string | null, u: User | null) {
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
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function doLogoutInternal() {
    setToken(null);
    setExpiresAtUtc(null);
    setUser(null);
    writeSession(null, null, null);
    clearTimer();
  }

  function startExpiryTimer(expUtc: string | null) {
    clearTimer();
    if (!expUtc) {
      doLogoutInternal();
      return;
    }
    const ms = new Date(expUtc).getTime() - Date.now();
    if (ms <= 0) {
      doLogoutInternal();
      return;
    }
    timerRef.current = window.setTimeout(() => {
      doLogoutInternal();
    }, ms);
  }

  // carrega sessão
  useEffect(() => {
    const { t, exp, u } = readSession();
    if (t && exp && u && !isExpired(exp)) {
      setToken(t);
      setExpiresAtUtc(exp);
      setUser(u);
      startExpiryTimer(exp);
    } else {
      doLogoutInternal();
    }
    return clearTimer;
  }, []);

  // sincroniza separador
  useEffect(() => {
    function onStorage() {
      const { t, exp, u } = readSession();
      setToken(t ?? null);
      setExpiresAtUtc(exp ?? null);
      setUser(u ?? null);
      if (t && exp && u && !isExpired(exp)) {
        startExpiryTimer(exp);
      } else {
        doLogoutInternal();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(email: string, password: string) {
    const API = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:30120";

    let res: Response;
    try {
      res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, Password: password }),
      });
    } catch {
      throw new Error("Falha de rede ao contactar o servidor.");
    }

    if (!res.ok) {
      let data: any = {};
      try {
        data = await res.json();
      } catch {}
      const msg =
        res.status === 401
          ? "Credenciais inválidas."
          : data.error || data.detail || "Erro no login.";
      throw new Error(msg);
    }

    let data: {
      accessToken: string;
      expiresAtUtc: string;
      user: User;
    };
    try {
      data = await res.json();
    } catch {
      throw new Error("Resposta inválida do servidor.");
    }

    setToken(data.accessToken);
    setExpiresAtUtc(data.expiresAtUtc);
    setUser(data.user);
    writeSession(data.accessToken, data.expiresAtUtc, data.user);
    startExpiryTimer(data.expiresAtUtc);
  }

  function logout() {
    doLogoutInternal();
  }

  const value: AuthCtx = {
    user,
    token,
    isAuthenticated,
    isVerified,
    expiresAtUtc,
    login,
    logout,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
