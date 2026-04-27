import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/lib/api";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";

interface MatchData {
  id: string;
  homeTeam?: { id: string; name: string };
  awayTeam?: { id: string; name: string };
  homeScore?: number | null;
  awayScore?: number | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  field?: { name: string; address?: string } | null;
  round?: { tournament: { name: string } };
  events?: Array<{
    id: string;
    eventType: string;
    minute: number;
    extraMin: number;
    teamId?: string | null;
    player?: { name: string } | null;
  }>;
  referee?: { name: string } | null;
}

export default function MatchActa() {
  const router = useRouter();
  const { matchId } = router.query as { matchId: string };
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    fetchMatch();
  }, [matchId]);

  async function fetchMatch() {
    setLoading(true);
    try {
      const data = await api<{ match: MatchData }>(`/api/match/${matchId}`);
      setMatch(data.match);
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin" /></div>;
  }
  if (!match) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-black">Partido no encontrado</div>;
  }

  const homeEvents = match.events?.filter((e) => e.teamId === match.homeTeam?.id) || [];
  const awayEvents = match.events?.filter((e) => e.teamId === match.awayTeam?.id) || [];

  const eventLabel: Record<string, string> = {
    GOL: "GOL",
    GOAL: "GOL",
    ASISTENCIA: "ASIST",
    ASSIST: "ASIST",
    TARJETA_AMARILLA: "AMARILLA",
    YELLOW_CARD: "AMARILLA",
    TARJETA_ROJA: "ROJA",
    RED_CARD: "ROJA",
    SUSTITUCION: "CAMBIO",
    SUB: "CAMBIO",
    FALTA: "FALTA",
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <div className="no-print flex items-center justify-between mb-4 pb-3 border-b">
          <button onClick={() => router.back()} className="text-sm flex items-center gap-1.5 text-gray-700 hover:text-black">
            <ArrowLeft size={16} /> Volver
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-black text-white text-sm font-bold flex items-center gap-2">
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>

        <header className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">El Pitazo · Acta de Partido</p>
          <h1 className="font-black text-2xl uppercase mt-1">{match.round?.tournament?.name || "Torneo"}</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" }) : "Fecha s/d"}
            {match.field?.name && ` · ${match.field.name}`}
          </p>
        </header>

        <div className="grid grid-cols-3 items-center gap-2 border-y py-4 mb-4">
          <div className="text-center">
            <p className="font-bold uppercase text-lg">{match.homeTeam?.name || "TBD"}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Local</p>
          </div>
          <div className="text-center">
            <div className="font-black text-5xl tabular-nums">
              {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold uppercase text-lg">{match.awayTeam?.name || "TBD"}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Visita</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-bold uppercase text-xs text-gray-500 mb-2">Eventos local</h3>
            <ul className="space-y-1">
              {homeEvents.length === 0 ? <li className="text-gray-400">—</li> : homeEvents.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-gray-200 pb-0.5">
                  <span>{e.player?.name || "—"}</span>
                  <span className="text-gray-600">{e.minute}'{e.extraMin ? `+${e.extraMin}` : ""} {eventLabel[e.eventType] || e.eventType}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold uppercase text-xs text-gray-500 mb-2">Eventos visita</h3>
            <ul className="space-y-1">
              {awayEvents.length === 0 ? <li className="text-gray-400">—</li> : awayEvents.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-gray-200 pb-0.5">
                  <span>{e.player?.name || "—"}</span>
                  <span className="text-gray-600">{e.minute}'{e.extraMin ? `+${e.extraMin}` : ""} {eventLabel[e.eventType] || e.eventType}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-10 text-sm text-gray-700">
          <div className="border-t pt-2 text-center">Capitán Local</div>
          <div className="border-t pt-2 text-center">Capitán Visita</div>
        </div>
        <div className="mt-8 border-t pt-2 text-center text-sm text-gray-700">
          {match.referee?.name || "Árbitro"}
        </div>
      </div>
    </div>
  );
}
