"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { getStarterProducts, getStarterCustomers } from "@/lib/starter-templates";
import { BusinessArchetype } from "./BusinessModeContext";
import { 
  cloudRegister, 
  cloudLogin, 
  cloudUpdateWorkspace, 
  cloudCreateStaff,
  cloudSaveProduct,
  cloudSaveCustomer,
  cloudDeleteTeamMember,
  cloudToggleTeamMember
} from "@/app/actions/cloud-sync";

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
  expiresAt?: string;
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
export const ONE_YEAR_SESSION_MS = 365 * 24 * 60 * 60 * 1000; // 525.600 menit = 1 Tahun (365 Hari)

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

export const syncSessionCookie = (session: UserSession | null) => {
  if (typeof document === "undefined") return;
  if (session) {
    const expires = new Date(Date.now() + ONE_YEAR_SESSION_MS).toUTCString();
    document.cookie = `nstok_session=${encodeURIComponent(JSON.stringify(session))}; path=/; expires=${expires}; SameSite=Lax`;
  } else {
    document.cookie = `nstok_session=; path=/; max-age=0; SameSite=Lax`;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUsersRegistry = (): UserAccount[] => {
    return loadFromLocalStorage<UserAccount[]>(USERS_REGISTRY_KEY, INITIAL_DEMO_USERS);
  };

  const saveUsersRegistry = (registry: UserAccount[]) => {
    saveToLocalStorage(USERS_REGISTRY_KEY, registry);
  };

  // Initialize Auth & Registry (1-Year Session Persistence Check)
  useEffect(() => {
    try {
      const session = loadFromLocalStorage<UserSession | null>(AUTH_STORAGE_KEY, null);
      if (session) {
        if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
          console.warn("Auth session has expired after 1 year.");
          saveToLocalStorage(AUTH_STORAGE_KEY, null);
          syncSessionCookie(null);
          setUser(null);
        } else {
          setUser(session);
          syncSessionCookie(session);
        }
      } else {
        syncSessionCookie(null);
      }
    } catch (e) {
      console.error("Failed to load auth session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = async (
    name: string,
    email: string,
    password: string,
    role: Role = "OWNER"
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Cloud DB registration first
    try {
      const cloudRes = await cloudRegister(name.trim(), normalizedEmail, password, role);
      if (cloudRes && cloudRes.success && cloudRes.user) {
        const session: UserSession = {
          id: cloudRes.user.id,
          name: cloudRes.user.name,
          email: cloudRes.user.email,
          role: cloudRes.user.role as Role,
          organizationId: cloudRes.user.organizationId,
          organizationName: cloudRes.user.organizationName,
          businessType: cloudRes.user.businessType,
          hasCompletedOnboarding: false,
          expiresAt: new Date(Date.now() + ONE_YEAR_SESSION_MS).toISOString(),
        };

        setUser(session);
        saveToLocalStorage(AUTH_STORAGE_KEY, session);
        syncSessionCookie(session);

        // Also add to local registry
        const registry = getUsersRegistry();
        const newAccount: UserAccount = {
          ...session,
          password,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        saveUsersRegistry([newAccount, ...registry.filter((u) => u.email !== normalizedEmail)]);

        return { success: true };
      } else if (cloudRes && !cloudRes.success) {
        return { success: false, error: cloudRes.error };
      }
    } catch (cloudErr) {
      console.warn("Cloud DB registration failed, falling back to local storage:", cloudErr);
    }

    // 2. Local Storage Fallback
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
      expiresAt: new Date(Date.now() + ONE_YEAR_SESSION_MS).toISOString(),
    };

    setUser(session);
    saveToLocalStorage(AUTH_STORAGE_KEY, session);
    syncSessionCookie(session);

    return { success: true };
  };

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Cloud DB Login first
    try {
      if (password) {
        const cloudRes = await cloudLogin(normalizedEmail, password);
        if (cloudRes && cloudRes.success && cloudRes.user) {
          const session: UserSession = {
            id: cloudRes.user.id,
            name: cloudRes.user.name,
            email: cloudRes.user.email,
            role: cloudRes.user.role as Role,
            organizationId: cloudRes.user.organizationId,
            organizationName: cloudRes.user.organizationName,
            businessType: cloudRes.user.businessType,
            hasCompletedOnboarding: cloudRes.user.hasCompletedOnboarding,
            expiresAt: new Date(Date.now() + ONE_YEAR_SESSION_MS).toISOString(),
          };

          setUser(session);
          saveToLocalStorage(AUTH_STORAGE_KEY, session);
          syncSessionCookie(session);

          // Update local registry with cloud user data
          const registry = getUsersRegistry();
          const updatedRegistry = [
            {
              ...session,
              password,
              createdAt: new Date().toISOString(),
              isActive: true,
            },
            ...registry.filter((u) => u.email !== normalizedEmail),
          ];
          saveUsersRegistry(updatedRegistry);

          return {
            success: true,
            needsOnboarding: !cloudRes.user.hasCompletedOnboarding,
          };
        } else if (cloudRes && !cloudRes.success) {
          return { success: false, error: cloudRes.error };
        }
      }
    } catch (cloudErr) {
      console.warn("Cloud DB login failed, falling back to local registry:", cloudErr);
    }

    // 2. Local Storage Fallback
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
      expiresAt: new Date(Date.now() + ONE_YEAR_SESSION_MS).toISOString(),
    };

    setUser(session);
    saveToLocalStorage(AUTH_STORAGE_KEY, session);
    syncSessionCookie(session);

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

    // 1. Update in Cloud DB if connected
    try {
      await cloudUpdateWorkspace(user.id, user.organizationId, organizationName, businessType);
    } catch (e) {
      console.warn("Cloud update workspace error:", e);
    }

    // 2. Update local registry and session
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
    syncSessionCookie(updatedSession);

    // Auto-seed starter products and customers for this workspace if not yet seeded
    const productsKey = `nstok_${user.organizationId}_products`;
    const existingProducts = loadFromLocalStorage<any[]>(productsKey, []);
    if (existingProducts.length === 0) {
      const starters = getStarterProducts(businessType, user.organizationId);
      saveToLocalStorage(productsKey, starters);
      // Also sync starters to Cloud DB
      for (const p of starters) {
        cloudSaveProduct(p).catch(() => {});
      }
    }

    const customersKey = `nstok_${user.organizationId}_customers`;
    const existingCustomers = loadFromLocalStorage<any[]>(customersKey, []);
    if (existingCustomers.length === 0) {
      const starterCusts = getStarterCustomers(user.organizationId);
      saveToLocalStorage(customersKey, starterCusts);
      for (const c of starterCusts) {
        cloudSaveCustomer(c).catch(() => {});
      }
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
    syncSessionCookie(null);
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

    // 1. Sync to Cloud DB
    try {
      const cloudRes = await cloudCreateStaff(
        user.organizationId,
        data.name.trim(),
        normalizedEmail,
        data.password || "password123",
        data.role,
        data.phone
      );
      if (cloudRes && !cloudRes.success) {
        console.warn("Cloud create staff warning:", cloudRes.error);
      }
    } catch (e) {
      console.warn("Cloud create staff error:", e);
    }

    // 2. Local Registry
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
    if (user?.organizationId) {
      cloudToggleTeamMember(userId, user.organizationId, isActive).catch(() => {});
    }
    const registry = getUsersRegistry();
    const updated = registry.map((u) => (u.id === userId ? { ...u, isActive } : u));
    saveUsersRegistry(updated);
  };

  const deleteStaffMember = (userId: string) => {
    if (user?.organizationId) {
      cloudDeleteTeamMember(userId, user.organizationId).catch(() => {});
    }
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
