import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle, Clock, XCircle, CreditCard, Store,
  Building2, Banknote, RefreshCw, TrendingUp,
} from "lucide-react";

interface Props {
  tournamentId?: string;
}

const methodLabel: Record<string, string> = {
  MERCADOPAGO: "MercadoPago",
  OXXO: "OXXO Pay",
  SPEI: "SPEI",
  CASH: "Efectivo",
  STRIPE: "Stripe",
};

const methodIcon: Record<string, React.ReactNode> = {
  MERCADOPAGO: <CreditCard size={14} className="text-blue-400" />,
  OXXO: <Store size={14} className="text-yellow-400" />,
  SPEI: <Building2 size={14} className="text-green-400" />,
  CASH: <Banknote size={14} className="text-orange-400" />,
  STRIPE: <CreditCard size={14} className="text-purple-400" />,
};

const payStatusBadge: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PAID: { label: "Pagado", cls: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle size={12} /> },
  PENDING: { label: "Pendiente", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock size={12} /> },
  PARTIAL: { label: "Parcial", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <Clock size={12} /> },
  REFUNDED: { label: "Devuelto", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <RefreshCw size={12} /> },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function OrganizerPayoutDashboard({ tournamentId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) fetchData();
    else setData(null);
  }, [tournamentId]);

  async function fetchData() {
    setLoading(true);
    try {
      const result = await api(`/api/payments/tournament/${tournamentId}`);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCash(teamId: string) {
    setConfirming(teamId);
    try {
      await api("/api/payments/cash/confirm", {
        method: "POST",
        body: JSON.stringify({ teamId, tournamentId }),
      });
      toast.success("Pago en efectivo confirmado");
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Error al confirmar pago");
    } finally {
      setConfirming(null);
    }
  }

  const fmt = (n: number) => `$${Number(n || 0).toLocaleString("es-MX")}`;

  if (!tournamentId) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <DollarSign size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Selecciona un torneo</h3>
        <p className="text-gray-400 text-sm">Ve a Torneos y selecciona uno para gestionar sus pagos</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <DollarSign size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Sin datos de pagos</h3>
        <p className="text-gray-400 text-sm">Los pagos aparecerán aquí cuando los equipos se registren</p>
      </div>
    );
  }

  const totalExpected = (data.totalCollected ?? 0) + (data.totalPending ?? 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <TrendingUp size={20} className="text-green-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(data.totalCollected)}</div>
          <div className="text-gray-400 text-sm">Total cobrado</div>
          <div className="text-gray-500 text-xs mt-1">{data.teamsPaid} equipo(s)</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <Clock size={20} className="text-yellow-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(data.totalPending)}</div>
          <div className="text-gray-400 text-sm">Pendiente</div>
          <div className="text-gray-500 text-xs mt-1">{data.teamsPending} equipo(s)</div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <DollarSign size={20} className="text-blue-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(totalExpected)}</div>
          <div className="text-gray-400 text-sm">Total esperado</div>
          <div className="text-gray-500 text-xs mt-1">{(data.teams ?? []).length} equipo(s) total</div>
        </div>
      </div>

      {/* Method breakdown */}
      {data.byMethod && Object.keys(data.byMethod).length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Desglose por método de pago</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.byMethod).map(([method, amount]: [string, any]) => (
              <div key={method} className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                {methodIcon[method] ?? <DollarSign size={14} className="text-gray-400" />}
                <div>
                  <div className="text-white text-sm font-bold">{fmt(amount)}</div>
                  <div className="text-gray-500 text-xs">{methodLabel[method] ?? method}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams list */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Pagos por equipo</h3>
          <button onClick={fetchData} className="text-gray-400 hover:text-white text-xs transition-colors flex items-center gap-1">
            <RefreshCw size={12} /> Actualizar
          </button>
        </div>
        <div className="space-y-0">
          {(data.teams ?? []).map((team: any) => {
            const badge = payStatusBadge[team.payStatus] ?? payStatusBadge.PENDING;
            const teamPayments = (data.payments ?? []).filter(
              (p: any) => p.teamId === team.id && p.status === "COMPLETED"
            );
            return (
              <div
                key={team.id}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{team.name}</p>
                  {teamPayments.length > 0 && (
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      {methodIcon[teamPayments[0].method]}
                      {methodLabel[teamPayments[0].method] ?? teamPayments[0].method}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${badge.cls}`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                  {team.payStatus !== "PAID" && (
                    <button
                      onClick={() => confirmCash(team.id)}
                      disabled={confirming === team.id}
                      className="text-xs px-3 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {confirming === team.id ? "..." : "✓ Efectivo"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {(data.teams ?? []).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No hay equipos registrados aún</p>
          )}
        </div>
      </div>

      {/* Recent payments log */}
      {(data.payments ?? []).length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Historial de transacciones</h3>
          <div className="space-y-0">
            {(data.payments as any[]).slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {methodIcon[p.method] ?? <DollarSign size={12} className="text-gray-400" />}
                    <span className="text-white text-sm font-medium truncate">{p.team?.name ?? "—"}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString("es-MX", { dateStyle: "medium" })}
                    {p.user?.name && ` · ${p.user.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-white font-semibold text-sm">{fmt(Number(p.amount))}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    p.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : p.status === "FAILED"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  }`}>
                    {p.status === "COMPLETED" ? "Pagado" : p.status === "FAILED" ? "Fallido" : "Pendiente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
