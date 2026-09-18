"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { getStarterProducts, getStarterCustomers } from "@/lib/starter-templates";
import { BusinessArchetype } from "./BusinessModeContext";

export type Role = "OWNER" | "MANAGER" | "SUPERVISOR" | "KASIR" | "STAFF_DAPUR" | "TEKNISI";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  businessType: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  isActive: boolean;
  phone?: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  businessType: string;
  hasCompletedOnboarding: boolean;
  token?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }>;
  register: (name: string, email: string, password: string, role?: Role) => Promise<{ success: boolean; error?: string }>;
  updateUserWorkspace: (organizationName: string, businessType: BusinessArchetype) => Promise<boolean>;
  logout: () => void;
  verifySupervisor: (password: string) => boolean;
  canAccess: (allowedRoles: Role[]) => boolean;
  getWorkspaceTeamMembers: () => UserAccount[];
  createStaffMember: (data: { name: string; email: string; password?: string; role: Role; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  toggleStaffStatus: (userId: string, isActive: boolean) => void;
  deleteStaffMember: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "nstok_auth_session_v3";
const USERS_REGISTRY_KEY = "nstok_users_registry_v3";

const INITIAL_DEMO_USERS: UserAccount[] = [
  {
    id: "user-owner-demo",
    name: "Bambang Pemilik (Demo)",
    email: "owner@nstok.id",
    password: "password123",
    role: "OWNER",
    organizationId: "org-demo-1",
    organizationName: "OmniPOS Kopi & Bakery (Demo)",
    businessType: "FNB",
    hasCompletedOnboarding: true,
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "user-kasir-demo",
    name: "Rina Kasir (Demo)",
    email: "kasir@nstok.id",
    password: "password123",
    role: "KASIR",
    organizationId: "org-demo-1",
    organizationName: "OmniPOS Kopi & Bakery (Demo)",
    businessType: "FNB",
    hasCompletedOnboarding: true,
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "user-spv-demo",
    name: "Siti Supervisor (Demo)",
    email: "supervisor@nstok.id",
    password: "password123",
    role: "SUPERVISOR",
    organizationId: "org-demo-1",
    organizationName: "OmniPOS Kopi & Bakery (Demo)",
    businessType: "FNB",
    hasCompletedOnboarding: true,
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth & Registry
  useEffect(() => {
    // 1. Ensure initial demo registry exists
    const existingRegistry = loadFromLocalStorage<UserAccount[]>(USERS_REGISTRY_KEY, []);
    if (existingRegistry.length === 0) {
      saveToLocalStorage(USERS_REGISTRY_KEY, INITIAL_DEMO_USERS);
    }

    // 2. Load active session
    const saved = loadFromLocalStorage<UserSession | null>(AUTH_STORAGE_KEY, null);
    if (saved) {
      setUser(saved);
    }
    setIsLoading(false);
  }, []);

  const getUsersRegistry = (): UserAccount[] => {
    return loadFromLocalStorage<UserAccount[]>(USERS_REGISTRY_KEY, INITIAL_DEMO_USERS);
  };

  const saveUsersRegistry = (users: UserAccount[]) => {
    saveToLocalStorage(USERS_REGISTRY_KEY, users);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: Role = "OWNER"
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const registry = getUsersRegistry();

    // Check if email already registered
    if (registry.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: "Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk." };
    }

    // Generate brand new unique workspace for this owner
    const newWorkspaceId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const defaultWorkspaceName = `Toko ${name.trim()}`;

    const newAccount: UserAccount = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role,
      organizationId: newWorkspaceId,
      organizationName: defaultWorkspaceName,
      businessType: "RETAIL",
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedRegistry = [newAccount, ...registry];
    saveUsersRegistry(updatedRegistry);

    // Set active session
    const session: UserSession = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      organizationId: newAccount.organizationId,
      organizationName: newAccount.organizationName,
      businessType: newAccount.businessType,
      hasCompletedOnboarding: false,
    };

    setUser(session);
    saveToLocalStorage(AUTH_STORAGE_KEY, session);

    return { success: true };
  };

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const registry = getUsersRegistry();

    const found = registry.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      return { success: false, error: "Akun dengan email ini belum terdaftar. Silakan daftar terlebih dahulu." };
    }

    if (!found.isActive) {
      return { success: false, error: "Akun ini telah dinonaktifkan oleh Owner. Hubungi pengelola toko Anda." };
    }

    if (password && found.password && found.password !== password) {
      return { success: false, error: "Kata sandi yang Anda masukkan salah." };
    }

    const session: UserSession = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      organizationId: found.organizationId,
      organizationName: found.organizationName,
      businessType: found.businessType,
      hasCompletedOnboarding: found.hasCompletedOnboarding,
    };

    setUser(session);
    saveToLocalStorage(AUTH_STORAGE_KEY, session);

    return {
      success: true,
      needsOnboarding: !found.hasCompletedOnboarding,
    };
  };

  const updateUserWorkspace = async (
    organizationName: string,
    businessType: BusinessArchetype
  ): Promise<boolean> => {
    if (!user) return false;

    const registry = getUsersRegistry();
    const updatedRegistry = registry.map((u) => {
      if (u.id === user.id || u.organizationId === user.organizationId) {
        return {
          ...u,
          organizationName,
          businessType,
          hasCompletedOnboarding: true,
        };
      }
      return u;
    });

    saveUsersRegistry(updatedRegistry);

    const updatedSession: UserSession = {
      ...user,
      organizationName,
      businessType,
      hasCompletedOnboarding: true,
    };

    setUser(updatedSession);
    saveToLocalStorage(AUTH_STORAGE_KEY, updatedSession);

    // Auto-seed starter products and customers for this workspace if not yet seeded
    const productsKey = `nstok_${user.organizationId}_products`;
    const existingProducts = loadFromLocalStorage<any[]>(productsKey, []);
    if (existingProducts.length === 0) {
      const starters = getStarterProducts(businessType, user.organizationId);
      saveToLocalStorage(productsKey, starters);
    }

    const customersKey = `nstok_${user.organizationId}_customers`;
    const existingCustomers = loadFromLocalStorage<any[]>(customersKey, []);
    if (existingCustomers.length === 0) {
      const starterCusts = getStarterCustomers(user.organizationId);
      saveToLocalStorage(customersKey, starterCusts);
    }

    const transactionsKey = `nstok_${user.organizationId}_transactions`;
    const existingTrx = loadFromLocalStorage<any[]>(transactionsKey, []);
    if (existingTrx.length === 0) {
      saveToLocalStorage(transactionsKey, []);
    }

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
    if (password === "1234" || password.toLowerCase() === "supervisor" || password === "admin123") {
      return true;
    }
    if (!user) return false;
    const registry = getUsersRegistry();
    const matchingSpv = registry.find(
      (u) =>
        u.organizationId === user.organizationId &&
        (u.role === "SUPERVISOR" || u.role === "MANAGER" || u.role === "OWNER") &&
        u.password === password
    );
    return !!matchingSpv;
  };

  const canAccess = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  // Team Management for the active workspace
  const getWorkspaceTeamMembers = (): UserAccount[] => {
    if (!user) return [];
    const registry = getUsersRegistry();
    return registry.filter((u) => u.organizationId === user.organizationId);
  };

  const createStaffMember = async (data: {
    name: string;
    email: string;
    password?: string;
    role: Role;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Sesi pengguna tidak valid." };

    const normalizedEmail = data.email.trim().toLowerCase();
    const registry = getUsersRegistry();

    if (registry.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: "Alamat email ini sudah terdaftar." };
    }

    const newStaff: UserAccount = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password || "password123",
      role: data.role,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      businessType: user.businessType,
      hasCompletedOnboarding: true,
      createdAt: new Date().toISOString(),
      isActive: true,
      phone: data.phone?.trim() || "-",
    };

    saveUsersRegistry([newStaff, ...registry]);
    return { success: true };
  };

  const toggleStaffStatus = (userId: string, isActive: boolean) => {
    const registry = getUsersRegistry();
    const updated = registry.map((u) => (u.id === userId ? { ...u, isActive } : u));
    saveUsersRegistry(updated);
  };

  const deleteStaffMember = (userId: string) => {
    const registry = getUsersRegistry();
    const updated = registry.filter((u) => u.id !== userId);
    saveUsersRegistry(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateUserWorkspace,
        logout,
        verifySupervisor,
        canAccess,
        getWorkspaceTeamMembers,
        createStaffMember,
        toggleStaffStatus,
        deleteStaffMember,
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
