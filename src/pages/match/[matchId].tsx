import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronLeft, Plus, X, Loader2, Clock,
} from "lucide-react";

function MatchClock({ startedAt, phase }: { startedAt: string | null; phase: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase === "FINALIZADO" || phase === "Finalizado") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const display = useMemo(() => {
    if (!startedAt) return "--:--";
    const elapsedMs = now - new Date(startedAt).getTime();
    if (elapsedMs < 0) return "00:00";
    const totalSec = Math.floor(elapsedMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [now, startedAt]);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-mono text-emerald-400">
      <Clock size={12} />
      <span className="tabular-nums">{display}</span>
    </div>
  );
}

const EVENT_TYPES = [
  { type: "GOL", label: "Gol", icon: "⚽", color: "bg-green-600 hover:bg-green-500" },
  { type: "ASISTENCIA", label: "Asistencia", icon: "🅰️", color: "bg-blue-600 hover:bg-blue-500" },
  { type: "TARJETA_AMARILLA", label: "T. Amarilla", icon: "🟨", color: "bg-yellow-500 hover:bg-yellow-400" },
  { type: "TARJETA_ROJA", label: "T. Roja", icon: "🟥", color: "bg-red-600 hover:bg-red-500" },
  { type: "SUSTITUCION", label: "Sustitución", icon: "🔄", color: "bg-purple-600 hover:bg-purple-500" },
  { type: "FALTA", label: "Falta", icon: "⚠️", color: "bg-orange-600 hover:bg-orange-500" },
];

const PHASE_LABELS: Record<string, string> = {
  PRIMER_TIEMPO: "Primer tiempo",
  MEDIO_TIEMPO: "Medio tiempo",
  SEGUNDO_TIEMPO: "Segundo tiempo",
  FINALIZADO: "Finalizado",
};

function phaseFromMatch(match: any): string {
  if (match.status === "SCHEDULED") return "Sin empezar";
  if (match.status === "COMPLETED") return "Finalizado";
  return PHASE_LABELS[match.notes] ?? "En juego";
}

function nextAction(match: any): { action: string; label: string; color: string } | null {
  if (match.status === "SCHEDULED") return { action: "START", label: "▶ Iniciar partido", color: "bg-green-600 hover:bg-green-500" };
  if (match.status === "IN_PROGRESS") {
    if (match.notes === "PRIMER_TIEMPO") return { action: "HALF_TIME", label: "⏸ Medio tiempo", color: "bg-yellow-600 hover:bg-yellow-500" };
    if (match.notes === "MEDIO_TIEMPO") return { action: "SECOND_HALF", label: "▶ Iniciar 2T", color: "bg-green-600 hover:bg-green-500" };
    if (match.notes === "SEGUNDO_TIEMPO") return { action: "FINISH", label: "🏁 Finalizar partido", color: "bg-red-700 hover:bg-red-600" };
  }
  return null;
}

function EventIcon({ type }: { type: string }) {
  const et = EVENT_TYPES.find((e) => e.type === type);
  return <span className="text-lg">{et?.icon ?? "📌"}</span>;
}

export default function MatchPage() {
  const router = useRouter();
  const { matchId } = router.query as { matchId: string };
  const { token } = useAuthStore();

  const [match, setMatch] = useState<any>(null);
  const [isReferee, setIsReferee] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Event modal state
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({ teamId: "", playerId: "", minute: "", extraMin: "" });
  const [submitting, setSubmitting] = useState(false);

  // Report form state
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ reportText: "", fieldCond: "Buena", incidents: [] as any[] });
  const [incidentForm, setIncidentForm] = useState({ type: "", description: "", minute: "" });

  const fetchAll = useCallback(async () => {
    if (!matchId) return;
    try {
      const [md, ed] = await Promise.all([
        api(`/api/match/${matchId}`, { auth: true }),
        api(`/api/match/${matchId}/events`),
      ]);
      setMatch(md.match);
      setIsReferee(md.isAssignedReferee);
      setEvents(ed.events || []);

      if (md.match?.status === "COMPLETED") {
        const rd = await api(`/api/match/${matchId}/report`);
        setReport(rd.report);
      }
    } catch (e: any) {
      toast.error(e.message || "No se pudo cargar el partido");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleStatusAction(action: string) {
    try {
      await api(`/api/match/${matchId}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
      });
      await fetchAll();
      toast.success("Estado actualizado");
    } catch (e: any) {
      toast.error(e.message || "Error al cambiar estado");
    }
  }

  async function handleAddEvent() {
    if (!pendingType || !eventForm.minute) {
      toast.error("Ingresa el minuto del evento");
      return;
    }
    setSubmitting(true);
    try {
      await api(`/api/match/${matchId}/events`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          eventType: pendingType,
          teamId: eventForm.teamId || undefined,
          playerId: eventForm.playerId || undefined,
          minute: Number(eventForm.minute),
          extraMin: Number(eventForm.extraMin || 0),
        }),
        headers: { "Content-Type": "application/json" },
      });
      await fetchAll();
      setPendingType(null);
      setEventForm({ teamId: "", playerId: "", minute: "", extraMin: "" });
      toast.success("Evento registrado");
    } catch (e: any) {
      toast.error(e.message || "Error al registrar evento");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReport() {
    setSubmitting(true);
    try {
      await api(`/api/match/${matchId}/report`, {
        method: "POST",
        auth: true,
        body: JSON.stringify(reportForm),
        headers: { "Content-Type": "application/json" },
      });
      const rd = await api(`/api/match/${matchId}/report`);
      setReport(rd.report);
      setShowReport(false);
      toast.success("Reporte enviado");
    } catch (e: any) {
      toast.error(e.message || "Error al enviar reporte");
    } finally {
      setSubmitting(false);
    }
  }

  function addIncident() {
    if (!incidentForm.type || !incidentForm.description) return;
    setReportForm((r) => ({
      ...r,
      incidents: [...r.incidents, { ...incidentForm }],
    }));
    setIncidentForm({ type: "", description: "", minute: "" });
  }

  function playersForTeam(teamId: string) {
    if (!match) return [];
    if (match.homeTeam?.id === teamId) return match.homeTeam.members ?? [];
    if (match.awayTeam?.id === teamId) return match.awayTeam.members ?? [];
    return [];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={36} className="text-green-500 animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Partido no encontrado
      </div>
    );
  }

  const finished = match.status === "COMPLETED";
  const inProgress = match.status === "IN_PROGRESS";
  const actionBtn = nextAction(match);
  const homeName = match.homeTeam?.name ?? "Local";
  const awayName = match.awayTeam?.name ?? "Visitante";
  const homeColor = match.homeTeam?.colorHex ?? "#22c55e";
  const awayColor = match.awayTeam?.colorHex ?? "#3b82f6";
  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <p className="text-gray-400 text-xs">{match.round?.tournament?.name}</p>
          <p className="text-white text-sm font-semibold">{match.field?.name ?? "Campo por definir"}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-mono ${finished ? "bg-gray-700 text-gray-300" : inProgress ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
          {phaseFromMatch(match)}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-6 py-8">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: homeColor + "33", border: `2px solid ${homeColor}` }}>
              {homeName.charAt(0)}
            </div>
            <p className="text-white font-bold text-sm leading-tight">{homeName}</p>
            <p className="text-gray-500 text-xs">Local</p>
          </div>
          <div className="text-center px-6">
            <div className="text-5xl font-black text-white tracking-tight">
              {homeScore}<span className="text-gray-600 mx-2">-</span>{awayScore}
            </div>
            {match.scheduledAt && (
              <p className="text-gray-500 text-xs mt-1">
                {new Date(match.scheduledAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
              </p>
            )}
            {(inProgress || finished) && (
              <MatchClock startedAt={match.startedAt} phase={phaseFromMatch(match)} />
            )}
          </div>
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: awayColor + "33", border: `2px solid ${awayColor}` }}>
              {awayName.charAt(0)}
            </div>
            <p className="text-white font-bold text-sm leading-tight">{awayName}</p>
            <p className="text-gray-500 text-xs">Visitante</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4">
        {/* Referee controls */}
        {isReferee && !finished && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-xs uppercase font-semibold mb-3">Control del partido</p>
            {actionBtn && (
              <button onClick={() => handleStatusAction(actionBtn.action)}
                className={`w-full ${actionBtn.color} text-white py-3 rounded-xl font-bold transition-all mb-3`}>
                {actionBtn.label}
              </button>
            )}
            {inProgress && (
              <>
                <p className="text-gray-400 text-xs uppercase font-semibold mb-2">Registrar evento</p>
                <div className="grid grid-cols-3 gap-2">
                  {EVENT_TYPES.map((et) => (
                    <button key={et.type} onClick={() => { setPendingType(et.type); setEventForm({ teamId: "", playerId: "", minute: "", extraMin: "" }); }}
                      className={`${et.color} text-white py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1`}>
                      <span className="text-lg">{et.icon}</span>
                      {et.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Event form modal */}
        {pendingType && isReferee && (
          <div className="bg-gray-800 rounded-2xl p-4 border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold">
                {EVENT_TYPES.find((e) => e.type === pendingType)?.icon}{" "}
                {EVENT_TYPES.find((e) => e.type === pendingType)?.label}
              </p>
              <button onClick={() => setPendingType(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Equipo</label>
                <select value={eventForm.teamId} onChange={(e) => setEventForm((f) => ({ ...f, teamId: e.target.value, playerId: "" }))}
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">— Selecciona equipo —</option>
                  <option value={match.homeTeam?.id}>{homeName} (Local)</option>
                  <option value={match.awayTeam?.id}>{awayName} (Visitante)</option>
                </select>
              </div>
              {eventForm.teamId && (
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Jugador</label>
                  <select value={eventForm.playerId} onChange={(e) => setEventForm((f) => ({ ...f, playerId: e.target.value }))}
                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">— Selecciona jugador —</option>
                    {playersForTeam(eventForm.teamId).map((m: any) => (
                      <option key={m.userId} value={m.userId}>#{m.number} {m.user?.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-gray-400 text-xs mb-1 block">Minuto *</label>
                  <input type="number" min={0} max={120} value={eventForm.minute}
                    onChange={(e) => setEventForm((f) => ({ ...f, minute: e.target.value }))}
                    placeholder="45"
                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div className="w-24">
                  <label className="text-gray-400 text-xs mb-1 block">+ tiempo</label>
                  <input type="number" min={0} max={30} value={eventForm.extraMin}
                    onChange={(e) => setEventForm((f) => ({ ...f, extraMin: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <button onClick={handleAddEvent} disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all">
                {submitting ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Confirmar evento"}
              </button>
            </div>
          </div>
        )}

        {/* Event log */}
        <div className="bg-gray-900 rounded-2xl border border-white/10">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-white font-semibold text-sm">Eventos del partido ({events.length})</p>
          </div>
          {events.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Sin eventos registrados</div>
          ) : (
            <div className="divide-y divide-white/5">
              {events.map((ev: any) => {
                const isHomeEvent = ev.teamId === match.homeTeam?.id;
                return (
                  <div key={ev.id} className={`flex items-center gap-3 px-4 py-3 ${isHomeEvent ? "flex-row" : "flex-row-reverse"}`}>
                    <EventIcon type={ev.eventType} />
                    <div className={`flex-1 ${isHomeEvent ? "text-left" : "text-right"}`}>
                      <p className="text-white text-sm font-medium">{ev.player?.name ?? "—"}</p>
                      <p className="text-gray-500 text-xs">
                        {EVENT_TYPES.find((e) => e.type === ev.eventType)?.label ?? ev.eventType}
                        {" · "}
                        {isHomeEvent ? homeName : awayName}
                      </p>
                    </div>
                    <span className="text-gray-400 text-xs font-mono shrink-0">
                      {ev.minute}{ev.extraMin > 0 ? `+${ev.extraMin}` : ""}&apos;
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Referee Report section */}
        {finished && isReferee && (
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">Reporte de árbitro</p>
              {!report && (
                <button onClick={() => setShowReport(!showReport)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all">
                  {showReport ? "Cancelar" : "Llenar reporte"}
                </button>
              )}
            </div>

            {report && !showReport ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                  <CheckCircle2 size={16} /> Reporte enviado
                </div>
                {report.fieldCond && (
                  <p className="text-gray-400 text-sm">Condición del campo: <span className="text-white">{report.fieldCond}</span></p>
                )}
                {report.reportText && (
                  <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-3">{report.reportText}</p>
                )}
                {Array.isArray(report.incidents) && report.incidents.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Incidentes:</p>
                    {report.incidents.map((inc: any, i: number) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-1">
                        <p className="text-red-300 text-xs font-semibold">{inc.type} {inc.minute ? `(min. ${inc.minute})` : ""}</p>
                        <p className="text-gray-300 text-sm">{inc.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowReport(true)}
                  className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                  Editar reporte
                </button>
              </div>
            ) : showReport ? (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Condición del campo</label>
                  <select value={reportForm.fieldCond} onChange={(e) => setReportForm((f) => ({ ...f, fieldCond: e.target.value }))}
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    <option>Buena</option>
                    <option>Regular</option>
                    <option>Mala</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Observaciones generales</label>
                  <textarea rows={3} value={reportForm.reportText}
                    onChange={(e) => setReportForm((f) => ({ ...f, reportText: e.target.value }))}
                    placeholder="Describe el desarrollo del partido..."
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                </div>
                <div className="border border-white/10 rounded-xl p-3">
                  <p className="text-gray-400 text-xs font-semibold mb-2">Agregar incidente</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={incidentForm.type} onChange={(e) => setIncidentForm((f) => ({ ...f, type: e.target.value }))}
                      placeholder="Tipo (ej. pelea)"
                      className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" />
                    <input type="number" value={incidentForm.minute} onChange={(e) => setIncidentForm((f) => ({ ...f, minute: e.target.value }))}
                      placeholder="Minuto"
                      className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" />
                  </div>
                  <input value={incidentForm.description} onChange={(e) => setIncidentForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción del incidente"
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-xs mb-2" />
                  <button onClick={addIncident}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-all">
                    <Plus size={12} /> Agregar
                  </button>
                  {reportForm.incidents.map((inc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5 mt-1 text-xs">
                      <span className="text-gray-300">{inc.type} — {inc.description}</span>
                      <button onClick={() => setReportForm((f) => ({ ...f, incidents: f.incidents.filter((_, j) => j !== i) }))}
                        className="text-gray-500 hover:text-red-400 ml-2">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleSubmitReport} disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all">
                  {submitting ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Enviar reporte"}
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay reporte enviado todavía.</p>
            )}
          </div>
        )}

        {/* Organizer report view (non-referee finished match) */}
        {finished && !isReferee && report && (
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-4">
            <p className="text-white font-semibold text-sm mb-3">Reporte del árbitro</p>
            <p className="text-gray-400 text-xs mb-2">Por: {report.referee?.name}</p>
            {report.fieldCond && (
              <p className="text-gray-400 text-sm mb-2">Campo: <span className="text-white">{report.fieldCond}</span></p>
            )}
            {report.reportText && (
              <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-3">{report.reportText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
