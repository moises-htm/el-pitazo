import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Clock, ClipboardList } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function BracketView({ tournamentId }: { tournamentId?: string }) {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournamentId) fetchBracket();
    else setRounds([]);
  }, [tournamentId]);

  async function fetchBracket() {
    setLoading(true);
    try {
      const data = await api(`/api/tournaments/${tournamentId}/bracket`);
      setRounds(data.rounds || []);
    } catch { setRounds([]); }
    finally { setLoading(false); }
  }

  if (!tournamentId) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Selecciona un torneo</h3>
        <p className="text-gray-400 text-sm">Ve a Torneos y selecciona uno para ver su cuadro</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h2 className="text-white font-bold text-lg mb-4">Cuadro del Torneo</h2>
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : rounds.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList size={40} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">El bracket se generará cuando se cierren las inscripciones</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="space-y-8 min-w-[320px]">
            {rounds.map((round: any, rIdx: number) => (
              <div key={rIdx}>
                <h3 className="text-blue-300 text-sm font-semibold mb-3 uppercase tracking-wider">
                  {round.bracketType || `Ronda ${round.roundNum}`}
                </h3>
                <div className="space-y-3">
                  {(round.matches || []).map((match: any, mIdx: number) => (
                    <div key={mIdx} className={`bg-white/5 rounded-xl p-4 border ${match.status === "COMPLETED" ? "border-green-500/30" : "border-white/10"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className={`font-semibold ${match.homeScore !== null && match.homeScore > (match.awayScore || 0) ? "text-white" : "text-gray-300"}`}>
                            {match.homeTeam?.name || "Por definir"}
                          </div>
                          <div className={`font-semibold ${match.awayScore !== null && match.awayScore > (match.homeScore || 0) ? "text-white" : "text-gray-300"}`}>
                            {match.awayTeam?.name || "Por definir"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white w-8 text-center">{match.homeScore ?? "–"}</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-2xl font-bold text-white w-8 text-center">{match.awayScore ?? "–"}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <Clock size={12} />
                        {match.status === "COMPLETED" ? "Finalizado" :
                         match.scheduledAt ? new Date(match.scheduledAt).toLocaleString("es-MX") : "Próximo partido"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
