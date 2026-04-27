import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Share2, Download } from "lucide-react";

interface StandingRow {
  position: number;
  teamId: string;
  name: string;
  logo: string | null;
  colorHex: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface StandingsTableProps {
  tournamentId: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function StandingsTable({ tournamentId }: StandingsTableProps) {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    fetch(`/api/tournaments/${tournamentId}/standings`)
      .then((r) => r.json())
      .then((d) => {
        setStandings(d.standings || []);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo cargar la tabla");
        setLoading(false);
      });
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm text-center">
        {error}
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
        <TrendingUp size={40} className="mx-auto text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">La tabla se actualizará conforme se jueguen partidos</p>
      </div>
    );
  }

  const shareStandings = async () => {
    try {
      const r = await fetch(`/api/tournaments/${tournamentId}/standings-text`);
      const text = await r.text();
      const encoded = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs font-display uppercase tracking-wide text-gray-400">Posiciones</span>
        <div className="flex items-center gap-3">
          <a
            href={`/api/tournaments/${tournamentId}/standings.csv`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
            title="Descargar CSV (abre en Excel)"
          >
            <Download size={12} /> CSV
          </a>
          <button
            onClick={shareStandings}
            className="flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200"
            title="Compartir tabla por WhatsApp"
          >
            <Share2 size={12} /> Compartir
          </button>
        </div>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_repeat(7,_auto)] gap-x-3 px-4 py-2 border-b border-white/10 text-gray-500 text-xs font-semibold uppercase tracking-wide">
        <span className="w-5 text-center">#</span>
        <span>Equipo</span>
        <span className="w-6 text-center" title="Jugados">J</span>
        <span className="w-6 text-center" title="Ganados">G</span>
        <span className="w-6 text-center" title="Empatados">E</span>
        <span className="w-6 text-center" title="Perdidos">P</span>
        <span className="w-8 text-center" title="Diferencia de goles">DG</span>
        <span className="w-6 text-center" title="Goles a favor">GF</span>
        <span className="w-8 text-center text-green-400" title="Puntos">Pts</span>
      </div>

      {standings.map((row, idx) => {
        const color = row.colorHex ?? "#22c55e";
        const isTop3 = idx < 3;
        return (
          <div key={row.teamId}
            className={`grid grid-cols-[auto_1fr_repeat(7,_auto)] gap-x-3 px-4 py-3 items-center border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${isTop3 ? "bg-white/3" : ""}`}>
            <span className={`w-5 text-center text-sm font-bold ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-amber-600" : "text-gray-500"}`}>
              {idx === 0 ? <Trophy size={14} className="mx-auto text-yellow-400" /> : row.position}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: color + "33", border: `1.5px solid ${color}` }}>
                {row.logo ? (
                  <img src={row.logo} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  row.name.charAt(0)
                )}
              </div>
              <span className="text-white text-sm font-medium truncate">{row.name}</span>
            </div>
            <span className="w-6 text-center text-gray-300 text-sm">{row.played}</span>
            <span className="w-6 text-center text-green-400 text-sm font-semibold">{row.won}</span>
            <span className="w-6 text-center text-gray-400 text-sm">{row.drawn}</span>
            <span className="w-6 text-center text-red-400 text-sm">{row.lost}</span>
            <span className={`w-8 text-center text-sm font-semibold ${row.goalDiff > 0 ? "text-green-400" : row.goalDiff < 0 ? "text-red-400" : "text-gray-400"}`}>
              {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
            </span>
            <span className="w-6 text-center text-gray-400 text-sm">{row.goalsFor}</span>
            <span className="w-8 text-center text-green-400 text-sm font-black">{row.points}</span>
          </div>
        );
      })}
    </div>
  );
}
