import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Trophy, Search, MapPin, DollarSign, Clock, Wallet, MessageCircle } from "lucide-react";
import { LocationMap } from "@/components/location-map";
import { CredentialCard } from "@/components/credential-card";
import { SelfieCapture } from "@/components/selfie-capture";

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
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const [transferingTeamId, setTransferingTeamId] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<string>("");

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [myTournaments, setMyTournaments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSelfie, setShowSelfie] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    if (activeTab === "browse") fetchTournaments();
    if (activeTab === "my") fetchMyTournaments();
    if (activeTab === "stats") fetchStats();
    if (activeTab === "credential") fetchCredentials();
  }, [activeTab]);

  async function fetchTournaments() {
    setLoading(true); setError("");
    try {
      const data = await api("/api/tournaments?status=ACTIVE&limit=20", { auth: false });
      setTournaments(data.tournaments || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function fetchMyTournaments() {
    setLoading(true); setError("");
    try {
      const data = await api("/api/player/tournaments");
      setMyTournaments(data.tournaments || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function fetchStats() {
    setLoading(true); setError("");
    try {
      const data = await api("/api/player/stats");
      setStats(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function fetchCredentials() {
    setLoading(true); setError("");
    try {
      const data = await api("/api/player/credential");
      setCredentials(data.credentials || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function transferCaptain(teamId: string, newCaptainUserId: string) {
    try {
      await api(`/api/teams/${teamId}/transfer-captain`, {
        method: "POST",
        body: JSON.stringify({ newCaptainUserId }),
      });
      setTransferingTeamId(null);
      setTransferTarget("");
      await fetchMyTournaments();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleSelfieCapture(base64: string) {
    setSavingAvatar(true);
    try {
      const data = await api("/api/player/avatar", { method: "POST", body: JSON.stringify({ avatar: base64 }) });
      if (user) setUser({ ...user, avatar: data.avatar } as any);
      setShowSelfie(false);
    } catch (e: any) { alert(e.message); }
    finally { setSavingAvatar(false); }
  }

  const filtered = tournaments.filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.fieldLocation?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "browse", label: "Explorar" },
    { id: "my", label: "Mis Torneos" },
    { id: "stats", label: "Mis Stats" },
    { id: "credential", label: "Credencial" },
  ];

  const typeLabel = (t: string) => t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos+Elim" : "Swiss";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const avatar = (user as any)?.avatar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {showSelfie && <SelfieCapture onCapture={handleSelfieCapture} onClose={() => setShowSelfie(false)} />}

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt={user?.name} className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40" />
            ) : (
              <button onClick={() => setShowSelfie(true)} className="w-10 h-10 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-colors" title="Agregar foto">
                <span className="text-lg">👤</span>
              </button>
            )}
            <div>
              <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
              <p className="text-gray-400 text-sm">Panel de Jugador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/chat")}
              className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 hover:text-green-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >
              <MessageCircle size={15} />
              Chat
            </button>
            <span className="text-yellow-400 text-2xl">⚽</span>
          </div>
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
                        {(t.fieldLat || t.fieldAddress) && (
                          <div className="mt-3">
                            <LocationMap lat={t.fieldLat} lng={t.fieldLng} address={t.fieldAddress} name={t.fieldLocation} compact />
                          </div>
                        )}
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

                  {/* Captain Transfer — only show if captain and team has other members */}
                  {t.isCaptain && t.members && t.members.length >= 2 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      {transferingTeamId === t.teamId ? (
                        <div className="space-y-2">
                          <p className="text-yellow-400 text-sm font-medium">Transferir capitanía a:</p>
                          <select
                            value={transferTarget}
                            onChange={(e) => setTransferTarget(e.target.value)}
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50"
                          >
                            <option value="">Seleccionar jugador...</option>
                            {t.members
                              .filter((m: any) => m.userId !== user?.id)
                              .map((m: any) => (
                                <option key={m.userId} value={m.userId}>
                                  {m.userName}
                                </option>
                              ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => transferTarget && transferCaptain(t.teamId, transferTarget)}
                              disabled={!transferTarget}
                              className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            >
                              Confirmar transferencia
                            </button>
                            <button
                              onClick={() => { setTransferingTeamId(null); setTransferTarget(""); }}
                              className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setTransferingTeamId(t.teamId)}
                          className="text-xs text-yellow-400/70 hover:text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Transferir capitanía
                        </button>
                      )}
                    </div>
                  )}
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

        {activeTab === "credential" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg">Mi Credencial Digital</h2>

            {/* Selfie gate */}
            {!avatar && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">📷</div>
                <h3 className="text-white font-bold mb-2">Necesitas una foto para tu credencial</h3>
                <p className="text-gray-400 text-sm mb-4">El árbitro necesita verificar tu identidad visualmente</p>
                <button
                  onClick={() => setShowSelfie(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Tomar selfie ahora
                </button>
              </div>
            )}

            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)
            ) : credentials.length === 0 ? (
              <EmptyState icon="🪪" title="Sin credenciales" sub="Únete a un torneo para obtener tu credencial digital" />
            ) : (
              credentials.map((cred: any) => (
                <div key={cred.id} className="space-y-3">
                  <CredentialCard
                    member={{ ...cred, user: { ...cred.user, avatar: avatar || cred.user.avatar } }}
                    baseUrl={baseUrl}
                  />
                  <div className="flex gap-2">
                    <a
                      href={`/api/passes/apple-wallet/${cred.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-2.5 rounded-xl font-semibold transition-all text-sm border border-white/20"
                    >
                      <Wallet size={16} />
                      Apple Wallet
                    </a>
                    {avatar && (
                      <button
                        onClick={() => setShowSelfie(true)}
                        className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-2.5 px-4 rounded-xl transition-all text-sm border border-white/10"
                      >
                        Actualizar foto
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
