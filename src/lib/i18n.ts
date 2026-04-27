import { useEffect, useState } from "react";

export type Locale = "es" | "en";

const dict = {
  es: {
    "common.home": "Inicio",
    "common.feed": "Feed",
    "common.chat": "Chat",
    "common.profile": "Perfil",
    "common.tournaments": "Torneos",
    "common.loading": "Cargando…",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.share": "Compartir",
    "common.download": "Descargar",
    "common.back": "Volver",
    "common.continue": "Continuar",
    "common.error": "Error",
    "tournament.tab.info": "Info",
    "tournament.tab.teams": "Equipos",
    "tournament.tab.matches": "Partidos",
    "tournament.tab.standings": "Tabla",
    "tournament.tab.bracket": "Cuadro",
    "tournament.empty.teams": "Aún no hay equipos inscritos",
    "tournament.empty.matches": "Aún no hay partidos programados",
    "tournament.live": "EN VIVO",
    "tournament.final": "Final",
    "tournament.share": "Compartir torneo",
    "tournament.invite": "Invita a otros equipos",
    "tournament.location": "Ubicación",
    "tournament.teams": "Equipos",
    "tournament.matches": "Partidos",
    "tournament.fee": "Inscripción",
    "tournament.start": "Inicio",
    "match.score": "Marcador",
    "match.events": "Eventos",
    "settings.language": "Idioma",
    "auth.email_invalid": "Email no válido",
    "auth.phone_invalid": "Teléfono no válido",
    "leaderboard.title": "Tabla de Goleadores",
  },
  en: {
    "common.home": "Home",
    "common.feed": "Feed",
    "common.chat": "Chat",
    "common.profile": "Profile",
    "common.tournaments": "Tournaments",
    "common.loading": "Loading…",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.share": "Share",
    "common.download": "Download",
    "common.back": "Back",
    "common.continue": "Continue",
    "common.error": "Error",
    "tournament.tab.info": "Info",
    "tournament.tab.teams": "Teams",
    "tournament.tab.matches": "Matches",
    "tournament.tab.standings": "Standings",
    "tournament.tab.bracket": "Bracket",
    "tournament.empty.teams": "No teams yet",
    "tournament.empty.matches": "No matches scheduled yet",
    "tournament.live": "LIVE",
    "tournament.final": "Final",
    "tournament.share": "Share tournament",
    "tournament.invite": "Invite other teams",
    "tournament.location": "Location",
    "tournament.teams": "Teams",
    "tournament.matches": "Matches",
    "tournament.fee": "Registration",
    "tournament.start": "Start",
    "match.score": "Score",
    "match.events": "Events",
    "settings.language": "Language",
    "auth.email_invalid": "Invalid email",
    "auth.phone_invalid": "Invalid phone",
    "leaderboard.title": "Top Scorers",
  },
} as const;

export type TKey = keyof (typeof dict)["es"];

const COOKIE_NAME = "elp_lang";
let _listeners: Array<(l: Locale) => void> = [];

export function getLocale(): Locale {
  if (typeof window === "undefined") return "es";
  const m = document.cookie.match(new RegExp(`${COOKIE_NAME}=(es|en)`));
  if (m) return m[1] as Locale;
  const nav = navigator.language?.toLowerCase() || "es";
  return nav.startsWith("en") ? "en" : "es";
}

export function setLocale(l: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
  _listeners.forEach((fn) => fn(l));
}

export function t(key: TKey, locale?: Locale): string {
  const l = locale || getLocale();
  return (dict[l] as any)[key] ?? (dict.es as any)[key] ?? key;
}

export function useLocale(): [Locale, (l: Locale) => void] {
  const [l, setL] = useState<Locale>("es");
  useEffect(() => {
    setL(getLocale());
    const cb = (newL: Locale) => setL(newL);
    _listeners.push(cb);
    return () => {
      _listeners = _listeners.filter((x) => x !== cb);
    };
  }, []);
  return [l, (newL: Locale) => setLocale(newL)];
}

export function useT() {
  const [locale] = useLocale();
  return (key: TKey) => t(key, locale);
}
