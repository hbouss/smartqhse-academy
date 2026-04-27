"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth";

type User = {
  id: number;
  email: string;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
  is_premium: boolean;
  is_staff: boolean;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeout = 6000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (token: string): Promise<User> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL manquant");
    }

    const res = await fetchWithTimeout(
      `${baseUrl}/accounts/me/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      6000
    );

    if (!res.ok) {
      throw new Error("Impossible de récupérer le profil utilisateur");
    }

    return res.json();
  };

  const refreshUser = async () => {
    setLoading(true);

    try {
      const token = getAccessToken();

      if (!token) {
        setUser(null);
        setAccessTokenState(null);
        return;
      }

      const me = await fetchMe(token);
      setUser(me);
      setAccessTokenState(token);
    } catch (error) {
      console.error("Erreur refreshUser :", error);
      clearTokens();
      setUser(null);
      setAccessTokenState(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (access: string, refresh: string) => {
    setLoading(true);

    try {
      setTokens(access, refresh);
      const me = await fetchMe(access);
      setUser(me);
      setAccessTokenState(access);
    } catch (error) {
      console.error("Erreur login AuthProvider :", error);
      clearTokens();
      setUser(null);
      setAccessTokenState(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setAccessTokenState(null);
    setLoading(false);
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }

  return context;
}