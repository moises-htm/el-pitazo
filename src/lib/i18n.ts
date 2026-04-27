import { create } from "zustand";
import { storage } from "@/lib/storage";

type Lang = "es" | "en";

const dict: Record<Lang, Record<string, string>> = {
  es: {
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.back": "Volver",
    "common.loading": "Cargando...",
    "common.share": "Compartir",
    "common.copy": "Copiar",
    "common.copied": "¡Copiado!",
    "common.confirm": "Confirmar",
    "common.close": "Cerrar",
    "nav.home": "Inicio",
    "nav.tournaments": "Torneos",
    "nav.feed": "Feed",
    "nav.chat": "Chat",
    "nav.profile": "Perfil",
    "tournament.tabs.teams": "Equipos",
    "tournament.tabs.calendar": "Calendario",
    "tournament.tabs.scores": "Marcadores",
    "tournament.tabs.standings": "Tabla",
    "tournament.tabs.finance": "Finanzas",
    "tournament.preview": "Vista previa",
    "tournament.publish": "Publicar",
    "tournament.draft": "Guardar borrador",
    "tournament.duplicate": "Duplicar torneo",
    "profile.stats": "Estadísticas",
    "profile.history": "Historial",
    "profile.badges": "Logros",
    "profile.edit": "Editar perfil",
    "match.start": "Iniciar partido",
    "match.finish": "Finalizar",
    "match.event.goal": "Gol",
    "match.event.yellow": "Amarilla",
    "match.event.red": "Roja",
    "match.event.sub": "Sustitución",
    "feed.share": "Compartir",
    "feed.like": "Me gusta",
    "feed.comment": "Comentar",
    "settings.theme.dark": "Modo oscuro",
    "settings.theme.light": "Modo claro",
    "settings.lang": "Idioma",
  },
  en: {
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.loading": "Loading...",
    "common.share": "Share",
    "common.copy": "Copy",
    "common.copied": "Copied!",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "nav.home": "Home",
    "nav.tournaments": "Tournaments",
    "nav.feed": "Feed",
    "nav.chat": "Chat",
    "nav.profile": "Profile",
    "tournament.tabs.teams": "Teams",
    "tournament.tabs.calendar": "Calendar",
    "tournament.tabs.scores": "Scores",
    "tournament.tabs.standings": "Standings",
    "tournament.tabs.finance": "Finance",
    "tournament.preview": "Preview",
    "tournament.publish": "Publish",
    "tournament.draft": "Save draft",
    "tournament.duplicate": "Duplicate tournament",
    "profile.stats": "Stats",
    "profile.history": "History",
    "profile.badges": "Badges",
    "profile.edit": "Edit profile",
    "match.start": "Start match",
    "match.finish": "Finish",
    "match.event.goal": "Goal",
    "match.event.yellow": "Yellow",
    "match.event.red": "Red",
    "match.event.sub": "Sub",
    "feed.share": "Share",
    "feed.like": "Like",
    "feed.comment": "Comment",
    "settings.theme.dark": "Dark mode",
    "settings.theme.light": "Light mode",
    "settings.lang": "Language",
  },
};

const LANG_KEY = "lang";

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: (typeof window !== "undefined" ? (storage.get(LANG_KEY) as Lang) : null) || "es",
  setLang: (l) => {
    storage.set(LANG_KEY, l);
    set({ lang: l });
  },
  t: (key: string) => {
    const lang = get().lang;
    return dict[lang][key] ?? dict.es[key] ?? key;
  },
}));

export function t(lang: Lang, key: string): string {
  return dict[lang][key] ?? dict.es[key] ?? key;
}
