"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";

export type Role = "OWNER" | "MANAGER" | "SUPERVISOR" | "KASIR" | "STAFF_DAPUR" | "TEKNISI";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  token?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (email: string, role?: Role, orgName?: string) => Promise<boolean>;
  logout: () => void;
  verifySupervisor: (pinOrPassword: string) => boolean;
  canAccess: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "nstok_auth_session_v3";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const saved = loadFromLocalStorage<UserSession | null>(AUTH_STORAGE_KEY, {
      id: "user-owner-1",
      name: "Bambang Pamungkas (Owner)",
      email: "owner@omnipos.id",
      role: "OWNER",
      organizationId: "org-demo-1",
      organizationName: "OmniPOS Kopi & Bakery",
    });
    setUser(saved);
  }, []);

  const login = async (email: string, role: Role = "OWNER", orgName: string = "Toko Baru Saya"): Promise<boolean> => {
    const session: UserSession = {
      id: `user-${Date.now()}`,
      name: email.split("@")[0].toUpperCase(),
      email,
      role,
      organizationId: `org-${Date.now()}`,
      organizationName: orgName,
    };
    setUser(session);
    saveToLocalStorage(AUTH_STORAGE_KEY, session);
    return true;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = "/login";
    }
  };

  const verifySupervisor = (password: string): boolean => {
    // Mock check: supervisor or owner password/pin (default '1234' or 'supervisor')
    return password === "1234" || password.toLowerCase() === "supervisor" || password === "admin";
  };

  const canAccess = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        verifySupervisor,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
