import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const TOKEN_KEY = "ekieco_token";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [, setLocation] = useLocation();

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setLocation("/");
  };

  return { token, login, logout, isAuthenticated: !!token };
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}
