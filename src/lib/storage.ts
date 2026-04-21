// Thin abstraction over key-value storage so the auth layer doesn't import
// `localStorage` directly. When this app is wrapped in Capacitor / Expo for
// iOS/Android, swap this file for @capacitor/preferences or expo-secure-store
// without touching callers.

const KEY_PREFIX = "el-pitazo:";

function safe<T>(fn: () => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const storage = {
  get(key: string): string | null {
    return safe(() => window.localStorage.getItem(KEY_PREFIX + key), null);
  },
  set(key: string, value: string): void {
    safe(() => window.localStorage.setItem(KEY_PREFIX + key, value), undefined);
  },
  remove(key: string): void {
    safe(() => window.localStorage.removeItem(KEY_PREFIX + key), undefined);
  },
};
