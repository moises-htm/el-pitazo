import { create } from "zustand";
import { storage } from "@/lib/storage";

export type Theme = "dark" | "light";

const THEME_KEY = "theme";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  hydrate: () => void;
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "light") root.classList.add("light");
  else root.classList.remove("light");
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: "dark",
  setTheme: (t) => {
    storage.set(THEME_KEY, t);
    applyTheme(t);
    set({ theme: t });
  },
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const stored = (storage.get(THEME_KEY) as Theme) || "dark";
    applyTheme(stored);
    set({ theme: stored });
  },
}));
