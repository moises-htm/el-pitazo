import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Loader2 } from "lucide-react";

type Period = "weekly" | "monthly" | "season" | "all";

interface Entry {
  id: string;
  name: string;
  avatar?: string | null;
  total: number;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "weekly", label: "Semana" },
  { id: "monthly", label: "Mes" },
  { id: "season", label: "Año" },
  { id: "all", label: "Total" },
];

export function Leaderboard({ tournamentId, eventType = "GOL" }: { tournamentId?: string; eventType?: string }) {
  const [period, setPeriod] = useState<Period>("weekly");
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period, eventType });
    if (tournamentId) params.set("tournamentId", tournamentId);
    api<{ leaderboard: Entry[] }>(`/api/leaderboard?${params.toString()}`, { auth: false })
      .then((d) => setData(d.leaderboard || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [period, tournamentId, eventType]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-black uppercase text-white flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" /> Leaderboard
        </h3>
        <div className="flex gap-1 text-xs">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-2 py-1 rounded font-display uppercase tracking-wide ${
                period === p.id ? "bg-green-500 text-black" : "text-gray-400 hover:text-white"
              }`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-gray-500" /></div>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">Sin datos en este periodo.</p>
      ) : (
        <ol className="space-y-2">
          {data.map((e, i) => (
            <li key={e.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className={`w-6 text-center font-display font-black ${i < 3 ? "text-yellow-400" : "text-gray-500"}`}>{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center overflow-hidden">
                {e.avatar ? <img src={e.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-green-400 font-bold text-xs">{e.name[0]?.toUpperCase()}</span>}
              </div>
              <span className="flex-1 text-white text-sm truncate">{e.name}</span>
              <span className="font-display font-black text-green-400 tabular-nums">{e.total}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
