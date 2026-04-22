import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Trophy, Search, MapPin, DollarSign, Clock, Wallet } from "lucide-react";
import { LocationMap } from "@/components/location-map";
import { CredentialCard } from "@/components/credential-card";
import { SelfieCapture } from "@/components/selfie-capture";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/8 rounded-2xl ${className}`} />;
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-display font-black uppercase text-white mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{sub}</p>
    </div>
  );
}

export default function PlayerDashboard() {
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
  const [joinTournament, setJoinTournament] = useState<any>(null);
  const [joinTeamName, setJoinTeamName] = useState("");
  const [joining, setJoining] = useState(false);

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

  async function confirmJoin() {
    if (!joinTournament) return;
    const name = joinTeamName.trim();
    if (name.length < 2) {
      toast.error("Nombre de equipo muy corto");
      return;
    }
    setJoining(true);
    try {
      await api(`/api/tournaments/${joinTournament.id}/join`, {
        method: "POST",
        body: JSON.stringify({ teamName: name }),
      });
      toast.success("¡Inscrito! Tu equipo fue registrado.");
      setJoinTournament(null);
      setJoinTeamName("");
      setActiveTab("my");
      await fetchMyTournaments();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as any)?.message || "No se pudo inscribir");
    } finally {
      setJoining(false);
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
    { id: "browse", label: "Explorar", icon: <Search size={14} /> },
    { id: "my", label: "Mis Torneos", icon: <Trophy size={14} /> },
    { id: "stats", label: "Mis Stats", icon: <DollarSign size={14} /> },
    { id: "credential", label: "Credencial", icon: <Wallet size={14} /> },
  ];

  const typeLabel = (t: string) => t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos+Elim" : "Swiss";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const avatar = (user as any)?.avatar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 animate-fade-in-up">
      {showSelfie && <SelfieCapture onCapture={handleSelfieCapture} onClose={() => setShowSelfie(false)} />}

      {/* Tab bar */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-5 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-1 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-display uppercase tracking-wide transition-all duration-300 flex-1 justify-center ${
                  activeTab === tab.id
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 animate-fade-in-up">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {/* Browse tab */}
        {activeTab === "browse" && (
          <>
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar torneos, equipos, campos..."
                className="w-full input-neon rounded-2xl pl-12 pr-4 py-3"
              />
            </div>
            <div className="space-y-4">
              <h2 className="font-display font-black text-xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Torneos disponibles</h2>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
              ) : filtered.length === 0 ? (
                <EmptyState icon="🏆" title="No hay torneos disponibles" sub={search ? "Intenta con otra búsqueda" : "Los torneos activos aparecerán aquí"} />
              ) : (
                filtered.map((t: any) => (
                  <div key={t.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:scale-[1.02] hover:border-white/20 transition-all duration-300">
                    {t.colorHex && (
                      <div className="h-1 rounded-full mb-4 -mt-1" style={{ backgroundColor: t.colorHex }} />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy size={16} className="text-yellow-400 shrink-0" />
                          <span className="text-xs text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded font-display uppercase tracking-wide">{typeLabel(t.type)}</span>
                        </div>
                        <h3 className="font-display font-black text-xl uppercase text-white mb-1 truncate">{t.name}</h3>
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
                        onClick={() => { setJoinTournament(t); setJoinTeamName(""); }}
                        className="btn-neon shrink-0 px-4 py-2 text-sm active:scale-95 transition-transform"
                      >
                        Inscribirse
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* My Tournaments tab */}
        {activeTab === "my" && (
          <div className="space-y-4">
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Mis Torneos</h2>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : myTournaments.length === 0 ? (
              <EmptyState icon="⚽" title="Aún no estás en ningún torneo" sub="Explora torneos disponibles e inscríbete con tu equipo" />
            ) : (
              myTournaments.map((t: any) => (
                <div key={t.id} className="card-glass card-glow overflow-hidden">
                  {t.team?.colorHex && (
                    <div className="h-1" style={{ backgroundColor: t.team.colorHex }} />
                  )}
                  <div className="p-5">
                    <h3 className="font-display font-black text-xl uppercase text-white">{t.name}</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded font-display uppercase tracking-wide ${
                        t.status === "ACTIVE"
                          ? "bg-[#39FF14]/20 text-[#39FF14]"
                          : t.status === "COMPLETED"
                          ? "bg-gray-500/20 text-gray-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {t.status === "ACTIVE" ? "● Activo" : t.status === "COMPLETED" ? "✓ Completado" : "◎ Por iniciar"}
                      </span>
                      <span className="text-gray-400 text-sm font-display">Equipo: <span className="text-white font-bold">{t.teamName}</span></span>
                      {t.isCaptain && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-display uppercase tracking-wide">Capitán</span>}
                    </div>
                    {t.teamId && (
                      <div className="mt-3">
                        <WhatsAppShareButton
                          text={`¡Únete a mi equipo ${t.teamName} en El Pitazo! ⚽🔥\n${typeof window !== "undefined" ? window.location.origin : "https://elpitazo.app"}/join/team?id=${t.teamId}`}
                          label="Invitar jugadores"
                        />
                      </div>
                    )}

                    {/* Captain Transfer — only show if captain and team has other members */}
                    {t.isCaptain && t.members && t.members.length >= 2 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        {transferingTeamId === t.teamId ? (
                          <div className="space-y-2">
                            <p className="text-yellow-400 text-sm font-display uppercase tracking-wide">Transferir capitanía a:</p>
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
                                className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-display uppercase tracking-wide transition-all"
                              >
                                Confirmar transferencia
                              </button>
                              <button
                                onClick={() => { setTransferingTeamId(null); setTransferTarget(""); }}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#39FF14]/30 text-white font-display uppercase tracking-wide px-3 py-2 rounded-lg text-sm transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setTransferingTeamId(t.teamId)}
                            className="text-xs text-yellow-400/70 hover:text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40 px-3 py-1.5 rounded-lg transition-all font-display uppercase tracking-wide"
                          >
                            Transferir capitanía
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Stats tab */}
        {activeTab === "stats" && (
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 mb-4">Estadísticas</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: stats.matches, label: "Partidos" },
                  { value: stats.goals, label: "Goles" },
                  { value: stats.assists, label: "Asistencias" },
                  { value: stats.redCards, label: "Rojas" },
                ].map((stat) => (
                  <div key={stat.label} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
                    <div className="score-number text-6xl text-[#39FF14] mb-1">{stat.value}</div>
                    <div className="font-display text-xs uppercase tracking-widest text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="📊" title="Aún sin estadísticas" sub="Juega en torneos para acumular estadísticas" />
            )}
          </div>
        )}

        {/* Credential tab */}
        {activeTab === "credential" && (
          <div className="space-y-4">
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Mi Credencial Digital</h2>

            {/* Selfie gate */}
            {!avatar && (
              <div className="card-glass p-6 text-center border border-[#39FF14]/20">
                <div className="text-5xl mb-3">📷</div>
                <h3 className="font-display font-black uppercase text-white mb-2">Necesitas una foto para tu credencial</h3>
                <p className="text-gray-400 text-sm mb-4">El árbitro necesita verificar tu identidad visualmente</p>
                <button
                  onClick={() => setShowSelfie(true)}
                  className="btn-neon px-6 py-3"
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
                      className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#39FF14]/30 text-white font-display uppercase tracking-wide py-2.5 rounded-xl transition-all text-sm"
                    >
                      <Wallet size={16} />
                      Apple Wallet
                    </a>
                    {avatar && (
                      <button
                        onClick={() => setShowSelfie(true)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#39FF14]/30 text-white font-display uppercase tracking-wide py-2.5 px-4 rounded-xl transition-all text-sm"
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

      {/* Inscribirse modal */}
      {joinTournament && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="glass border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6">
            <h3 className="font-display font-black uppercase text-white text-lg mb-1">Inscribirse</h3>
            <p className="text-gray-400 text-sm mb-4">{joinTournament.name}</p>

            <label className="text-gray-300 text-sm block mb-1">Nombre de tu equipo</label>
            <input
              type="text"
              value={joinTeamName}
              onChange={(e) => setJoinTeamName(e.target.value)}
              autoFocus
              disabled={joining}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#39FF14] focus:outline-none"
              placeholder="Ej: Los Indios"
            />
            <p className="text-gray-500 text-xs mt-2">
              Serás el capitán. Podrás invitar jugadores después.
            </p>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setJoinTournament(null); setJoinTeamName(""); }}
                disabled={joining}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl font-display uppercase tracking-wide transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmJoin}
                disabled={joining}
                className="flex-1 btn-neon py-3 disabled:opacity-50 active:scale-95 transition-transform"
              >
                {joining ? "Inscribiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
