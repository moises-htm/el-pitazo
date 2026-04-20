// Zustand store for auth
import { create } from "zustand";

interface User {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  role: string[];
  country?: string;
  lang?: string;
  rating?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  register: (data: { name: string; phone?: string; email?: string; password: string; role: string; country?: string; lang?: string }) => Promise<void>;
  login: (data: { phone?: string; email?: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  register: async (data) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registration failed");
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
    set({ user: json.user, token: json.token });
  },

  logout: () => {
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}));
