// Zustand store for auth. Persists via the `storage` abstraction so
// it can be swapped for native secure storage (Capacitor Preferences /
// Expo SecureStore) without touching callers.
import { create } from "zustand";
import { storage } from "@/lib/storage";

interface User {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  role: string[];
  country?: string;
  lang?: string;
  rating?: number;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  hydrate: () => void;
  register: (data: {
    name: string;
    phone?: string;
    email?: string;
    password: string;
    role: string;
    country?: string;
    lang?: string;
  }) => Promise<void>;
  login: (data: { phone?: string; email?: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const TOKEN_KEY = "token";
const USER_KEY = "user";

function loadUser(): User | null {
  const raw = storage.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function persist(token: string | null, user: User | null) {
  if (token) storage.set(TOKEN_KEY, token);
  else storage.remove(TOKEN_KEY);

  if (user) storage.set(USER_KEY, JSON.stringify(user));
  else storage.remove(USER_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  hydrate: () => {
    set({
      token: storage.get(TOKEN_KEY),
      user: loadUser(),
      hydrated: true,
    });
  },

  register: async (data) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registration failed");
    persist(json.token, json.user);
    set({ user: json.user, token: json.token });
  },

  login: async (data) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Login failed");
    persist(json.token, json.user);
    set({ user: json.user, token: json.token });
  },

  logout: () => {
    persist(null, null);
    set({ user: null, token: null });
  },

  setUser: (user) => {
    persist(useAuthStore.getState().token, user);
    set({ user });
  },
  setToken: (token) => {
    persist(token, useAuthStore.getState().user);
    set({ token });
  },
}));
