import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Camera, Trophy, Medal, Edit2, Save, X, Loader2 } from "lucide-react";

interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  earned: boolean;
  threshold?: number;
  progress?: number;
}

interface Stats {
  matches: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  tournaments: number;
}

interface ProfileTournament {
  id: string;
  name: string;
  status: string;
  teamName: string;
  startDate?: string | null;
}

const POSITIONS = ["Portero", "Defensa", "Mediocampista", "Delantero"];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, hydrated } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"stats" | "history" | "badges" | "edit">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [history, setHistory] = useState<ProfileTournament[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState({ name: "", position: "", preferredTeam: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchBadges();
    fetchHistory();
    api<{ streak: number }>("/api/player/streak").then((d) => setStreak(d.streak)).catch(() => {});
  }, [user?.id]);

  async function fetchProfile() {
    try {
      const data = await api<{ user: any }>("/api/profile");
      setProfile(data.user);
      setEditing({
        name: data.user.name || "",
        position: data.user.onboardingData?.position || "",
        preferredTeam: data.user.onboardingData?.preferredTeam || "",
        bio: data.user.onboardingData?.bio || "",
      });
    } catch {}
  }

  async function fetchBadges() {
    try {
      const data = await api<{ badges: Badge[]; stats: Stats }>("/api/player/badges");
      setBadges(data.badges);
      setStats(data.stats);
    } catch {}
  }

  async function fetchHistory() {
    try {
      const data = await api<{ tournaments: ProfileTournament[] }>("/api/player/tournaments");
      setHistory(data.tournaments || []);
    } catch {}
  }

  async function uploadAvatar(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 5MB)");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const upload = await api<{ url: string }>("/api/upload/image", {
          method: "POST",
          body: JSON.stringify({ image: dataUrl, folder: "avatars" }),
        });
        const updated = await api<{ user: any }>("/api/profile", {
          method: "PATCH",
          body: JSON.stringify({ avatar: upload.url }),
        });
        if (user) setUser({ ...user, avatar: updated.user.avatar } as any);
        setProfile(updated.user);
        toast.success("Foto actualizada");
      } catch (e: any) {
        toast.error(e.message || "Error al subir");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (editing.name.trim().length < 2) {
      toast.error("Nombre demasiado corto");
      return;
    }
    setSaving(true);
    try {
      const data = await api<{ user: any }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: editing.name.trim(),
          position: editing.position || null,
          preferredTeam: editing.preferredTeam.trim() || null,
          bio: editing.bio.trim() || null,
        }),
      });
      if (user) setUser({ ...user, name: data.user.name } as any);
      setProfile(data.user);
      toast.success("Perfil guardado");
      setTab("stats");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="animate-spin text-green-400" />
      </div>
    );
  }

  const avatar = profile?.avatar || (user as any)?.avatar;
  const initial = (profile?.name || user.name || "U")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-3">
            <ArrowLeft size={16} /> Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-display font-black text-green-400">{initial}</span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-green-500 text-black flex items-center justify-center disabled:opacity-50"
                title="Cambiar foto"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-2xl uppercase text-white truncate">{profile?.name || user.name}</h1>
              <p className="text-sm text-gray-400">{profile?.email || user.email}</p>
              {profile?.onboardingData?.position && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-display uppercase">
                  {profile.onboardingData.position}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
            {[
              { id: "stats", label: "Stats" },
              { id: "history", label: "Historial" },
              { id: "badges", label: "Logros" },
              { id: "edit", label: "Editar" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-display uppercase tracking-wide ${
                  tab === t.id ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-gray-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-3">
        {tab === "stats" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats ? (
              [
                { label: "Partidos", value: stats.matches, color: "text-blue-400" },
                { label: "Goles", value: stats.goals, color: "text-green-400" },
                { label: "Asistencias", value: stats.assists, color: "text-purple-400" },
                { label: "Amarillas", value: stats.yellow, color: "text-yellow-400" },
                { label: "Rojas", value: stats.red, color: "text-red-400" },
                { label: "Torneos", value: stats.tournaments, color: "text-cyan-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <div className={`text-4xl font-display font-black ${s.color} tabular-nums`}>{s.value}</div>
                  <div className="text-xs text-gray-500 font-display uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              )).concat(
                <div key="streak" className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-4 text-center col-span-2 sm:col-span-3">
                  <div className="text-4xl font-display font-black text-orange-400 tabular-nums">🔥 {streak}</div>
                  <div className="text-xs text-orange-300 font-display uppercase tracking-wider mt-1">Racha de asistencia</div>
                </div>
              )
            ) : (
              <div className="col-span-full text-gray-500 text-sm text-center py-8">Cargando stats...</div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">Aún no has jugado torneos.</p>
            ) : (
              history.map((tour) => (
                <div key={tour.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-white font-display font-bold truncate">{tour.name}</p>
                    <p className="text-xs text-gray-500">Equipo: {tour.teamName} {tour.startDate && `· ${new Date(tour.startDate).toLocaleDateString("es-MX")}`}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded shrink-0 font-display uppercase ${
                    tour.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                    tour.status === "COMPLETED" ? "bg-gray-500/20 text-gray-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {tour.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "badges" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.length === 0 ? (
              <p className="col-span-full text-gray-500 text-sm text-center py-8">Cargando logros...</p>
            ) : (
              badges.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl p-4 text-center border transition-all ${
                    b.earned
                      ? "bg-gradient-to-br from-green-500/20 to-emerald-600/10 border-green-500/40"
                      : "bg-white/5 border-white/10 opacity-50"
                  }`}
                >
                  <div className="text-4xl mb-2">{b.emoji}</div>
                  <div className={`font-display font-bold uppercase text-sm ${b.earned ? "text-green-400" : "text-gray-500"}`}>{b.label}</div>
                  <p className="text-[10px] text-gray-400 mt-1">{b.description}</p>
                  {b.threshold && !b.earned && b.progress !== undefined && (
                    <div className="mt-2 text-[10px] text-gray-500">{b.progress}/{b.threshold}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "edit" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-display uppercase tracking-wide mb-1 block">Nombre</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-display uppercase tracking-wide mb-1 block">Posición</label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setEditing({ ...editing, position: editing.position === pos ? "" : pos })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-wide ${
                      editing.position === pos ? "bg-green-500 text-black" : "bg-white/5 border border-white/10 text-gray-400"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-display uppercase tracking-wide mb-1 block">Equipo preferido</label>
              <input
                value={editing.preferredTeam}
                onChange={(e) => setEditing({ ...editing, preferredTeam: e.target.value })}
                placeholder="Tu equipo favorito"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-display uppercase tracking-wide mb-1 block">Bio</label>
              <textarea
                value={editing.bio}
                onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                rows={3}
                placeholder="Cuéntanos sobre ti..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500/50 outline-none resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTab("stats")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm flex items-center justify-center gap-1.5"
              >
                <X size={14} /> Cancelar
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Save size={14} /> {saving ? "..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
