import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import { Users, Trophy, Target, TrendingUp, MessageCircle, Rss } from "lucide-react";

interface AnalyticsData {
  summary: {
    totalTeams: number;
    totalPlayers: number;
    totalMatches: number;
    completedMatches: number;
    matchRate: number;
    totalGoals: number;
    avgGoalsPerMatch: number;
    payRate: number;
    feedPosts: number;
    chatMessages: number;
  };
  registrationTimeline: { date: string; count: number }[];
  paymentBreakdown: { PAID: number; PARTIAL: number; PENDING: number; REFUNDED: number };
  goalsPerTeam: { name: string; goals: number }[];
  topScorers: { id: string; name: string; goals: number }[];
}

const PIE_COLORS = {
  PAID: "#39FF14",
  PARTIAL: "#3b82f6",
  PENDING: "#6b7280",
  REFUNDED: "#ef4444",
};

const PIE_LABELS: Record<string, string> = {
  PAID: "Pagado",
  PARTIAL: "Parcial",
  PENDING: "Pendiente",
  REFUNDED: "Reembolsado",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-gray-500 text-xs font-display uppercase tracking-wide">{label}</span>
        <span className="text-gray-600">{icon}</span>
      </div>
      <div className="font-display font-black text-3xl text-white">{value}</div>
      {sub && <div className="text-gray-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export function AnalyticsDashboard({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    setError("");
    api<AnalyticsData>(`/api/organizer/analytics/${tournamentId}`, { auth: true })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  const payPieData = Object.entries(data.paymentBreakdown)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: PIE_LABELS[key], value, color: PIE_COLORS[key as keyof typeof PIE_COLORS] }));

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Equipos" value={summary.totalTeams} icon={<Users size={16} />} />
        <StatCard label="Jugadores" value={summary.totalPlayers} icon={<Users size={16} />} />
        <StatCard label="Partidos" value={summary.totalMatches} sub={`${summary.completedMatches} completados (${summary.matchRate}%)`} icon={<Trophy size={16} />} />
        <StatCard label="Goles" value={summary.totalGoals} sub={`${summary.avgGoalsPerMatch} por partido`} icon={<Target size={16} />} />
        <StatCard label="Tasa de pago" value={`${summary.payRate}%`} sub={`${data.paymentBreakdown.PAID} de ${summary.totalTeams} equipos`} icon={<TrendingUp size={16} />} />
        <StatCard label="Posts en feed" value={summary.feedPosts} icon={<Rss size={16} />} />
        <StatCard label="Mensajes de chat" value={summary.chatMessages} icon={<MessageCircle size={16} />} />
        <StatCard label="Avg goles/partido" value={summary.avgGoalsPerMatch} icon={<Target size={16} />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration timeline */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-display font-bold uppercase text-white text-sm mb-4">Inscripciones por día</h3>
          {data.registrationTimeline.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.registrationTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Line type="monotone" dataKey="count" stroke="#39FF14" strokeWidth={2} dot={{ fill: "#39FF14", r: 3 }} name="Equipos" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment pie */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-display font-bold uppercase text-white text-sm mb-4">Estado de pagos</h3>
          {payPieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sin equipos</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={payPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {payPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                />
                <Legend formatter={(value) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Goals per team */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-display font-bold uppercase text-white text-sm mb-4">Goles por equipo</h3>
          {data.goalsPerTeam.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sin partidos completados</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.goalsPerTeam.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(n) => n.slice(0, 10)} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                />
                <Bar dataKey="goals" fill="#39FF14" radius={[4, 4, 0, 0]} name="Goles" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top scorers */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-display font-bold uppercase text-white text-sm mb-4">Goleadores</h3>
          {data.topScorers.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sin goles registrados</div>
          ) : (
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 180 }}>
              {data.topScorers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-display ${
                      i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-yellow-700 text-black" : "bg-white/10 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-white text-sm font-medium truncate">{s.name}</span>
                  <span className="text-[#39FF14] font-display font-black text-sm">{s.goals}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
