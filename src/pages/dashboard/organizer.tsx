import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { TournamentCreate } from "@/components/tournament-create";
import { TeamList } from "@/components/team-list";
import { BracketView } from "@/components/bracket-view";
import { FinancialDashboard } from "@/components/financial-dashboard";
import { StandingsTable } from "@/components/standings-table";
import { Users, Trophy, DollarSign, ClipboardList, BarChart3, Plus, Clock, TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function OrganizerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("tournaments");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduleChanges, setScheduleChanges] = useState<any[]>([]);
  const [scheduleChangesLoading, setScheduleChangesLoading] = useState(false);
  const [matchReports, setMatchReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const tabs = [
    { id: "tournaments", label: "Torneos", icon: <Trophy size={18} /> },
    { id: "teams", label: "Equipos", icon: <Users size={18} /> },
    { id: "brackets", label: "Cuadros", icon: <ClipboardList size={18} /> },
    { id: "standings", label: "Tabla", icon: <TrendingUp size={18} /> },
    { id: "financial", label: "Finanzas", icon: <DollarSign size={18} /> },
    { id: "analytics", label: "Métricas", icon: <BarChart3 size={18} /> },
    { id: "schedule-changes", label: "Cambios de horario", icon: <Clock size={18} /> },
    { id: "reports", label: "Reportes", icon: <FileText size={18} /> },
  ];

  useEffect(() => {
    if (activeTab === "tournaments") fetchTournaments();
    if (activeTab === "schedule-changes") fetchScheduleChanges();
    if (activeTab === "reports" && selectedTournament) fetchMatchReports(selectedTournament.id);
  }, [activeTab, selectedTournament]);

  async function fetchTournaments() {
    setLoading(true);
    try {
      const data = await api("/api/organizer/tournaments?limit=100", { auth: true });
      setTournaments(data.tournaments || []);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMatchReports(tournamentId: string) {
    setReportsLoading(true);
    try {
      // Fetch all rounds+matches with reports for this tournament
      const data = await api(`/api/tournaments/${tournamentId}/bracket`);
      const allMatches: any[] = [];
      for (const round of data.rounds ?? []) {
        for (const match of round.matches ?? []) {
          if (match.status === "COMPLETED") {
            try {
              const rd = await api(`/api/match/${match.id}/report`);
              allMatches.push({ ...match, report: rd.report });
            } catch {
              allMatches.push({ ...match, report: null });
            }
          }
        }
      }
      setMatchReports(allMatches);
    } catch {
      setMatchReports([]);
    } finally {
      setReportsLoading(false);
    }
  }

  async function fetchScheduleChanges() {
    setScheduleChangesLoading(true);
    try {
      const data = await api("/api/organizer/schedule-changes", { auth: true });
      setScheduleChanges(data.requests || []);
    } catch {
      setScheduleChanges([]);
    } finally {
      setScheduleChangesLoading(false);
    }
  }

  async function handleScheduleChangeAction(id: string, action: "approve" | "reject", note?: string) {
    try {
      await api(`/api/schedule-change/${id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ action, note }),
        headers: { "Content-Type": "application/json" },
      });
      toast.success(action === "approve" ? "Solicitud aprobada" : "Solicitud rechazada");
      fetchScheduleChanges();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al procesar solicitud");
    }
  }

  const typeLabel = (t: string) => t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos" : "Swiss";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Organizador</p>
          </div>
          <span className="text-yellow-400">👔</span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-2">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {activeTab === "tournaments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Mis Torneos</h2>
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm">
                <Plus size={16} /> {showCreate ? "Cancelar" : "Nuevo Torneo"}
              </button>
            </div>
            {showCreate && (
              <TournamentCreate onCreated={(t) => { setTournaments((prev) => [t, ...prev]); setShowCreate(false); }} />
            )}
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : tournaments.length === 0 && !showCreate ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <Trophy size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-white font-semibold mb-1">Aún no tienes torneos</h3>
                <p className="text-gray-400 text-sm mb-4">Crea tu primer torneo para comenzar</p>
                <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                  Crear primer torneo
                </button>
              </div>
            ) : (
              tournaments.map((t: any) => (
                <div key={t.id}
                  onClick={() => setSelectedTournament(t)}
                  className={`bg-white/5 backdrop-blur-xl rounded-2xl p-5 border transition-all cursor-pointer ${selectedTournament?.id === t.id ? "border-blue-500/50" : "border-white/10 hover:border-white/20"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold">{t.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span>{typeLabel(t.type)}</span>
                        <span>Max {t.maxTeams} equipos</span>
                        {t.startDate && <span>{new Date(t.startDate).toLocaleDateString("es-MX")}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <WhatsAppShareButton
                        text={`¡Inscribe tu equipo en ${t.name}! ⚽ El torneo empieza pronto. Regístrate en https://elpitazo.app/tournaments/${t.id}`}
                        label="Compartir torneo"
                        compact={true}
                      />
                      <span className={`text-xs px-2 py-1 rounded ${t.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "teams" && <TeamList tournamentId={selectedTournament?.id} />}
        {activeTab === "brackets" && <BracketView tournamentId={selectedTournament?.id} />}
        {activeTab === "standings" && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg">Tabla de posiciones</h2>
            {selectedTournament ? (
              <StandingsTable tournamentId={selectedTournament.id} />
            ) : (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                <TrendingUp size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">Selecciona un torneo primero</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "financial" && <FinancialDashboard tournamentId={selectedTournament?.id} />}
        {activeTab === "analytics" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Métricas del Torneo</h3>
            <p className="text-gray-400">{selectedTournament ? "Próximamente" : "Selecciona un torneo primero"}</p>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Reportes de árbitros</h2>
              {selectedTournament && (
                <button onClick={() => fetchMatchReports(selectedTournament.id)} className="text-gray-400 hover:text-white text-sm">
                  Actualizar
                </button>
              )}
            </div>
            {!selectedTournament ? (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                <FileText size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">Selecciona un torneo primero</p>
              </div>
            ) : reportsLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : matchReports.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                <FileText size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">Sin partidos finalizados todavía</p>
              </div>
            ) : (
              matchReports.map((match: any) => (
                <div key={match.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {match.homeTeam?.name ?? "TBD"} {match.homeScore ?? 0} — {match.awayScore ?? 0} {match.awayTeam?.name ?? "TBD"}
                      </p>
                      {match.finishedAt && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {new Date(match.finishedAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${match.report ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {match.report ? "Con reporte" : "Sin reporte"}
                    </span>
                  </div>
                  {match.report ? (
                    <div className="bg-white/5 rounded-xl p-3 space-y-1.5">
                      {match.report.fieldCond && (
                        <p className="text-gray-400 text-xs">Campo: <span className="text-white">{match.report.fieldCond}</span></p>
                      )}
                      {match.report.reportText && (
                        <p className="text-gray-300 text-sm">{match.report.reportText}</p>
                      )}
                      {Array.isArray(match.report.incidents) && match.report.incidents.length > 0 && (
                        <div className="mt-2">
                          <p className="text-gray-500 text-xs mb-1">Incidentes: {match.report.incidents.length}</p>
                          {match.report.incidents.map((inc: any, i: number) => (
                            <div key={i} className="bg-red-500/10 rounded px-2 py-1 text-xs text-red-300 mb-1">
                              {inc.type} {inc.minute ? `(min. ${inc.minute})` : ""}: {inc.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs">El árbitro aún no ha enviado el reporte.</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "schedule-changes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Cambios de horario pendientes</h2>
              <button onClick={fetchScheduleChanges} className="text-gray-400 hover:text-white text-sm transition-colors">
                Actualizar
              </button>
            </div>
            {scheduleChangesLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : scheduleChanges.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <Clock size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-white font-semibold mb-1">Sin solicitudes pendientes</h3>
                <p className="text-gray-400 text-sm">No hay cambios de horario esperando tu aprobación</p>
              </div>
            ) : (
              scheduleChanges.map((req: any) => {
                const homeTeam = req.match?.homeTeam?.name ?? "TBD";
                const awayTeam = req.match?.awayTeam?.name ?? "TBD";
                const tournamentName = req.match?.round?.tournament?.name ?? "";
                const proposed = new Date(req.proposedTime).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                return (
                  <div key={req.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">{homeTeam} vs {awayTeam}</p>
                        {tournamentName && <p className="text-gray-400 text-xs mt-0.5">{tournamentName}</p>}
                        <p className="text-gray-300 text-sm mt-1">Nueva fecha propuesta: <span className="text-green-400">{proposed}</span></p>
                        {req.reason && <p className="text-gray-400 text-sm">Motivo: {req.reason}</p>}
                      </div>
                      <div className="flex flex-col gap-1 text-xs shrink-0">
                        <span className={`px-2 py-0.5 rounded ${req.captainBApproved ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {req.captainBApproved ? "Capitán B: OK" : "Capitán B: pendiente"}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${req.refereeApproved ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {req.refereeApproved ? "Árbitro: OK" : "Árbitro: pendiente"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleScheduleChangeAction(req.id, "approve")}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-semibold text-sm transition-all">
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleScheduleChangeAction(req.id, "reject")}
                        className="flex-1 bg-red-600/80 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition-all">
                        Rechazar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
