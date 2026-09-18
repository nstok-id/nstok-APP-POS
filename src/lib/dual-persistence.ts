"use client";

// Dual Persistence Helper: Synchronizes state to localStorage (offline cache) and dispatches background sync

export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error loading localStorage key "${key}":`, error);
    return fallback;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(`${key}_last_updated`, new Date().toISOString());
  } catch (error) {
    console.error(`Error saving localStorage key "${key}":`, error);
  }
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingCount: number;
}
