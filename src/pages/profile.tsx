import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Camera, Edit3, Save, LogOut, Trophy, Target, Hand, Square, Award, Calendar, Medal } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useT, useLocale } from "@/lib/i18n";

interface Stats {
  matches: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  country: string;
  lang: string;
  role: string[];
  createdAt: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/8 rounded-2xl ${className}`} />;
}

interface Badge {
  id: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
  earned: boolean;
}

function deriveBadges(stats: Stats | null, history: any[]): Badge[] {
  if (!stats) return [];
  const isCaptainAnywhere = history.some((t) => t.isCaptain);
  return [
    { id: "first-goal", label: "Primer gol", desc: "Anota tu primer gol", icon: Target, color: "from-emerald-500 to-green-500", earned: stats.goals >= 1 },
    { id: "scorer", label: "Goleador", desc: "5 goles totales", icon: Trophy, color: "from-yellow-500 to-orange-500", earned: stats.goals >= 5 },
    { id: "ace", label: "Crack", desc: "10 goles", icon: Medal, color: "from-purple-500 to-pink-500", earned: stats.goals >= 10 },
    { id: "playmaker", label: "Asistente", desc: "5 asistencias", icon: Hand, color: "from-blue-500 to-cyan-500", earned: stats.assists >= 5 },
    { id: "veteran", label: "Veterano", desc: "Juega 10 partidos", icon: Calendar, color: "from-gray-400 to-gray-600", earned: stats.matches >= 10 },
    { id: "captain", label: "Capitán", desc: "Lidera un equipo", icon: Award, color: "from-yellow-400 to-amber-600", earned: isCaptainAnywhere },
  ];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, hydrated, hydrate, logout } = useAuthStore();
  const t = useT();
  const [locale, setLocale] = useLocale();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !token) router.replace("/auth/login");
  }, [hydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api<{ user: Profile }>("/api/player/profile"),
      api<Stats>("/api/player/stats").catch(() => null),
      api<{ tournaments: any[] }>("/api/player/tournaments").catch(() => ({ tournaments: [] })),
    ])
      .then(([p, s, h]) => {
        setProfile(p.user);
        setEditName(p.user.name);
        setStats(s);
        setHistory(h.tournaments || []);
      })
      .catch(() => toast.error("No se pudo cargar el perfil"))
      .finally(() => setLoading(false));
  }, [token]);

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 1.5MB)");
      return;
    }
    setSavingAvatar(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await api("/api/player/avatar", { method: "POST", body: JSON.stringify({ avatar: dataUrl }) });
      setProfile((p) => p ? { ...p, avatar: dataUrl } : p);
      toast.success("Foto actualizada");
    } catch {
      toast.error("No se pudo guardar la foto");
    } finally {
      setSavingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!editName.trim()) return toast.error("El nombre es obligatorio");
    try {
      await api("/api/player/profile", { method: "PATCH", body: JSON.stringify({ name: editName.trim(), lang: locale }) });
      setProfile((p) => p ? { ...p, name: editName.trim() } : p);
      setEditing(false);
      toast.success("Perfil actualizado");
    } catch {
      toast.error("No se pudo guardar");
    }
  };

  const badges = deriveBadges(stats, history);

  if (!hydrated || !token || loading || !profile) {
    return (
      <div className="min-h-screen bg-pitch-grid p-4 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pitch-grid text-white">
      <header className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400/30 bg-white/5 flex items-center justify-center hover:border-emerald-400 transition relative"
              disabled={savingAvatar}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{profile.name.charAt(0).toUpperCase()}</span>
              )}
              <span className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1">
                <Camera size={12} />
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white w-full"
                autoFocus
              />
            ) : (
              <h1 className="font-display font-black text-2xl uppercase tracking-tight truncate">{profile.name}</h1>
            )}
            <p className="text-gray-500 text-xs truncate">{profile.email || profile.phone}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.role.map((r) => (
                <span key={r} className="text-[10px] bg-white/5 px-2 py-0.5 rounded uppercase tracking-wide font-display text-gray-400">{r}</span>
              ))}
            </div>
          </div>
          <button
            onClick={() => editing ? saveProfile() : setEditing(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            {editing ? <Save size={18} /> : <Edit3 size={18} />}
          </button>
        </div>

        {/* Language toggle */}
        <div className="mt-4 card-glass p-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">{t("settings.language")}</span>
          <div className="flex gap-2">
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-3 py-1 rounded text-xs font-display uppercase tracking-wide ${
                  locale === l ? "bg-emerald-500 text-black" : "bg-white/5 text-gray-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-6 space-y-4">
        {/* Stats */}
        {stats && (
          <section className="card-glass p-4">
            <h2 className="text-gray-400 text-xs font-display uppercase tracking-wide mb-3">Estadísticas</h2>
            <div className="grid grid-cols-5 gap-2">
              <StatBox label="Partidos" value={stats.matches} />
              <StatBox label="Goles" value={stats.goals} accent="text-emerald-400" />
              <StatBox label="Asist" value={stats.assists} accent="text-blue-400" />
              <StatBox label="🟨" value={stats.yellowCards} accent="text-yellow-400" />
              <StatBox label="🟥" value={stats.redCards} accent="text-red-400" />
            </div>
          </section>
        )}

        {/* Badges */}
        <section className="card-glass p-4">
          <h2 className="text-gray-400 text-xs font-display uppercase tracking-wide mb-3">Insignias</h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border text-center transition ${
                    b.earned
                      ? `bg-gradient-to-br ${b.color} bg-opacity-10 border-white/20 text-white`
                      : "bg-white/3 border-white/5 text-gray-600"
                  }`}
                  title={b.desc}
                >
                  <Icon size={24} className="mx-auto mb-1" />
                  <p className="text-[11px] font-display uppercase tracking-wide">{b.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* History */}
        <section className="card-glass p-4">
          <h2 className="text-gray-400 text-xs font-display uppercase tracking-wide mb-3">Historial</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no tienes torneos</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <Link
                  key={h.id}
                  href={`/tournament/${h.id}`}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate">{h.name}</p>
                    <p className="text-gray-500 text-xs">{h.teamName} {h.isCaptain && "• Capitán"}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-display uppercase ${
                    h.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" :
                    h.status === "COMPLETED" ? "bg-gray-500/20 text-gray-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {h.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={() => { logout(); router.push("/auth/login"); }}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-3 rounded-xl text-sm font-display uppercase tracking-wide transition"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <div className={`font-display font-black text-xl tabular-nums ${accent || "text-white"}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide font-display mt-0.5">{label}</div>
    </div>
  );
}
