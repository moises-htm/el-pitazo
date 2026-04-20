import { DollarSign, TrendingUp, Users, CreditCard, PieChart, BarChart3 } from "lucide-react";

export function FinancialDashboard() {
  const summary = {
    totalIncome: 45000,
    pendingIncome: 8500,
    totalExpenses: 32000,
    netIncome: 13000,
    teamsPaid: 24,
    teamsPending: 4,
    payments: [
      { id: "1", team: "Los Gallos", amount: 5000, method: "SPEI", status: "COMPLETED", date: "2026-04-18" },
      { id: "2", team: "Los Leones", amount: 5000, method: "OXXO", status: "COMPLETED", date: "2026-04-18" },
      { id: "3", team: "Los Rayados", amount: 5000, method: "STRIPE", status: "PENDING", date: "2026-04-19" },
      { id: "4", team: "Los Tigres", amount: 3500, method: "CASH", status: "PARTIAL", date: "2026-04-19" },
    ],
    expenses: [
      { id: "1", description: "Renta de campos", amount: 15000, category: "Campo" },
      { id: "2", description: "Árbitros", amount: 8000, category: "Personal" },
      { id: "3", description: "Agua y refrigerios", amount: 3500, category: "Logística" },
      { id: "4", description: "Premios", amount: 5500, category: "Premios" },
    ],
  };

  const formatCurrency = (amount) => `$${amount.toLocaleString('es-MX')}`;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <TrendingUp size={20} className="text-green-400 mb-2" />
          <div className="text-white font-bold text-lg">{formatCurrency(summary.totalIncome)}</div>
          <div className="text-gray-400 text-sm">Ingresos totales</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <CreditCard size={20} className="text-yellow-400 mb-2" />
          <div className="text-white font-bold text-lg">{formatCurrency(summary.pendingIncome)}</div>
          <div className="text-gray-400 text-sm">Pendiente de cobro</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <BarChart3 size={20} className="text-red-400 mb-2" />
          <div className="text-white font-bold text-lg">{formatCurrency(summary.totalExpenses)}</div>
          <div className="text-gray-400 text-sm">Gastos</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <DollarSign size={20} className="text-blue-400 mb-2" />
          <div className="text-white font-bold text-lg">{formatCurrency(summary.netIncome)}</div>
          <div className="text-gray-400 text-sm">Ganancia neta</div>
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Pagos recibidos</h3>
          <span className="text-gray-400 text-sm">{summary.teamsPaid} pagados · {summary.teamsPending} pendientes</span>
        </div>
        <div className="space-y-2">
          {summary.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">📋</div>
                <div>
                  <div className="text-white text-sm font-semibold">{p.team}</div>
                  <div className="text-gray-500 text-xs">{p.date} · {p.method}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold">{formatCurrency(p.amount)}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  p.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                  p.status === "PENDING" ? "bg-blue-500/20 text-blue-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {p.status === "COMPLETED" ? "✓ Recibido" : p.status === "PENDING" ? "⏳ Pendiente" : "⏳ Parcial"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4">Gastos del torneo</h3>
        <div className="space-y-2">
          {summary.expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                  {e.category === "Campo" ? "🏟" : e.category === "Personal" ? "👤" : e.category === "Logística" ? "🥤" : "🏆"}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{e.description}</div>
                  <div className="text-gray-500 text-xs">{e.category}</div>
                </div>
              </div>
              <span className="text-red-400 font-semibold">- {formatCurrency(e.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
