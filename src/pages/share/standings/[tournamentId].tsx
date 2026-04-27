import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/lib/api";
import { Loader2, Trophy } from "lucide-react";

interface Row {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export default function ShareStandings() {
  const router = useRouter();
  const { tournamentId } = router.query as { tournamentId: string };
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("Torneo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;
    Promise.all([
      api<{ standings: Row[] }>(`/api/tournaments/${tournamentId}/standings`, { auth: false }),
      api<{ tournament: { name: string } }>(`/api/tournaments/${tournamentId}`, { auth: false }).catch(() => null),
    ]).then(([s, t]) => {
      setRows(s.standings || []);
      if (t?.tournament?.name) setName(t.tournament.name);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-700 via-green-900 to-black">
        <Loader2 className="animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: "linear-gradient(160deg, #022c22 0%, #064e3b 40%, #052e16 100%)",
        backgroundImage:
          "radial-gradient(at 50% 0%, rgba(34, 197, 94, 0.18) 0%, transparent 50%), linear-gradient(160deg, #022c22 0%, #052e16 100%)",
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-yellow-400 mb-2">
            <Trophy size={20} />
            <span className="text-xs uppercase tracking-widest font-display font-black">El Pitazo</span>
          </div>
          <h1 className="font-display font-black text-3xl uppercase text-white leading-tight">{name}</h1>
          <p className="text-green-300 text-xs uppercase tracking-widest mt-1">Tabla de posiciones</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 bg-white/5 text-[10px] uppercase tracking-wider text-green-300 font-display">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Equipo</div>
            <div className="col-span-1 text-center">PJ</div>
            <div className="col-span-2 text-center">G-E-P</div>
            <div className="col-span-1 text-center">DG</div>
            <div className="col-span-2 text-right">PTS</div>
          </div>
          {rows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aún no hay partidos finalizados</div>
          ) : (
            rows.map((r) => (
              <div key={r.position} className="grid grid-cols-12 px-4 py-3 border-t border-white/5 items-center">
                <div className={`col-span-1 font-display font-black text-lg ${r.position <= 3 ? "text-yellow-400" : "text-gray-400"}`}>{r.position}</div>
                <div className="col-span-5 text-white font-bold truncate">{r.name}</div>
                <div className="col-span-1 text-center text-gray-300 tabular-nums">{r.played}</div>
                <div className="col-span-2 text-center text-gray-300 tabular-nums text-xs">{r.won}-{r.drawn}-{r.lost}</div>
                <div className={`col-span-1 text-center tabular-nums ${r.goalDiff > 0 ? "text-green-400" : r.goalDiff < 0 ? "text-red-400" : "text-gray-400"}`}>
                  {r.goalDiff > 0 ? "+" : ""}{r.goalDiff}
                </div>
                <div className="col-span-2 text-right font-display font-black text-xl text-white tabular-nums">{r.points}</div>
              </div>
            ))
          )}
        </div>

        <p className="text-center text-green-300/70 text-xs mt-6 font-display uppercase tracking-widest">
          elpitazo.app · Compártelo
        </p>
      </div>
    </div>
  );
}
