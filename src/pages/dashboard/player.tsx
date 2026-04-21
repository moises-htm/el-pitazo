import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Trophy, Search, MapPin, DollarSign, Clock, Loader2 } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{sub}</p>
    </div>
  );
}

export default function PlayerDashboard() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("browse");

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [myTournaments, setMyTournaments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeTab === "browse") fetchTournaments();
    if (activeTab === "my") fetchMyTournaments();
    if (activeTab === "stats") fetchStats();
  }, [activeTab]);

  async function fetchTournaments() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/tournaments?status=ACTIVE&limit=20", { auth: false });
      setTournaments(data.tournaments || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyTournaments() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/player/tournaments");
      setMyTournaments(data.tournaments || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/player/stats");
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = tournaments.filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.fieldLocation?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "browse", label: "Explorar" },
    { id: "my", label: "Mis Torneos" },
    { id: "stats", label: "Mis Stats" },
  ];

  const typeLabel = (t: string) => t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos+Elim" : "Swiss";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Jugador</p>
          </div>
          <span className="text-yellow-400 text-2xl">⚽</span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-2">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {activeTab === "browse" && (
          <>
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar torneos, equipos, campos..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg">Torneos disponibles</h2>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
              ) : filtered.length === 0 ? (
                <EmptyState icon="🏆" title="No hay torneos disponibles" sub={search ? "Intenta con otra búsqueda" : "Los torneos activos aparecerán aquí"} />
              ) : (
                filtered.map((t: any) => (
                  <div key={t.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy size={16} className="text-yellow-400 shrink-0" />
                          <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">{typeLabel(t.type)}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 truncate">{t.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-400 text-sm">
                          {t.fieldLocation && <span className="flex items-center gap-1"><MapPin size={14} />{t.fieldLocation}</span>}
                          {t.startDate && <span className="flex items-center gap-1"><Clock size={14} />{new Date(t.startDate).toLocaleDateString("es-MX")}</span>}
                          <span className="flex items-center gap-1"><DollarSign size={14} />{Number(t.regFee).toLocaleString("es-MX")} {t.currency}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert("Inscripción disponible próximamente")}
                        className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold transition-all text-sm">
                        Inscribirse
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "my" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg">Mis Torneos</h2>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : myTournaments.length === 0 ? (
              <EmptyState icon="⚽" title="Aún no estás en ningún torneo" sub="Explora torneos disponibles e inscríbete con tu equipo" />
            ) : (
              myTournaments.map((t: any) => (
                <div key={t.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                  <h3 className="text-white font-bold text-lg">{t.name}</h3>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${t.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : t.status === "COMPLETED" ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {t.status === "ACTIVE" ? "🟢 Activo" : t.status === "COMPLETED" ? "✅ Completado" : "📋 Por iniciar"}
                    </span>
                    <span className="text-gray-400 text-sm">Equipo: <span className="text-white">{t.teamName}</span></span>
                    {t.isCaptain && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Capitán</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.matches}</div>
                  <div className="text-gray-400 text-sm">Partidos</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.goals}</div>
                  <div className="text-gray-400 text-sm">Goles</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.assists}</div>
                  <div className="text-gray-400 text-sm">Asistencias</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.redCards}</div>
                  <div className="text-gray-400 text-sm">Rojas</div>
                </div>
              </div>
            ) : (
              <EmptyState icon="📊" title="Aún sin estadísticas" sub="Juega en torneos para acumular estadísticas" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
