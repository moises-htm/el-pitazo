import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DollarSign, TrendingUp, CreditCard, BarChart3 } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function FinancialDashboard({ tournamentId }: { tournamentId?: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournamentId) fetchFinancials();
    else setSummary(null);
  }, [tournamentId]);

  async function fetchFinancials() {
    setLoading(true);
    try {
      const data = await api(`/api/tournaments/${tournamentId}/financials`);
      setSummary(data);
    } catch { setSummary(null); }
    finally { setLoading(false); }
  }

  const fmt = (n: number) => `$${Number(n || 0).toLocaleString("es-MX")}`;

  if (!tournamentId) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <DollarSign size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Selecciona un torneo</h3>
        <p className="text-gray-400 text-sm">Ve a Torneos y selecciona uno para ver sus finanzas</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Sin datos financieros</h3>
        <p className="text-gray-400 text-sm">Los datos aparecerán cuando haya pagos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <TrendingUp size={20} className="text-green-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.totalIncome)}</div>
          <div className="text-gray-400 text-sm">Ingresos totales</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <CreditCard size={20} className="text-yellow-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.pendingIncome)}</div>
          <div className="text-gray-400 text-sm">Pendiente</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <BarChart3 size={20} className="text-red-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.totalExpenses)}</div>
          <div className="text-gray-400 text-sm">Gastos</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <DollarSign size={20} className="text-blue-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.netIncome)}</div>
          <div className="text-gray-400 text-sm">Ganancia neta</div>
        </div>
      </div>

      {summary.payments?.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Pagos recibidos</h3>
            <span className="text-gray-400 text-sm">{summary.teamsPaid} pagados · {summary.teamsPending} pendientes</span>
          </div>
          <div className="space-y-2">
            {summary.payments.map((p: any) => (
              <a
                key={p.id}
                href={`/payment/${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors -mx-2 px-2 rounded"
              >
                <div>
                  <div className="text-white text-sm font-semibold">{p.team?.name || "—"}</div>
                  <div className="text-gray-500 text-xs">{p.method} {p.paidAt ? `· ${new Date(p.paidAt).toLocaleDateString("es-MX")}` : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">{fmt(p.amount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {p.status === "COMPLETED" ? "✓ Recibo" : "⏳ Pendiente"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
