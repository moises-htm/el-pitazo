import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle, Clock, XCircle, Receipt, RefreshCw } from "lucide-react";

interface Props {
  teamId: string;
  payStatus?: string;
  regFee?: number;
  currency?: string;
  onPay?: () => void;
}

const methodLabel: Record<string, string> = {
  MERCADOPAGO: "MercadoPago",
  OXXO: "OXXO Pay",
  SPEI: "SPEI",
  CASH: "Efectivo",
  STRIPE: "Stripe",
};

const payStatusInfo: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Pagado", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
  PENDING: { label: "Pendiente", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  PARTIAL: { label: "Parcial", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  REFUNDED: { label: "Devuelto", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

const paymentStatusIcon = {
  COMPLETED: <CheckCircle size={12} className="text-green-400" />,
  FAILED: <XCircle size={12} className="text-red-400" />,
  PENDING: <Clock size={12} className="text-yellow-400" />,
  REFUNDED: <RefreshCw size={12} className="text-gray-400" />,
};

export function TeamPaymentStatus({ teamId, payStatus = "PENDING", regFee, currency = "MXN", onPay }: Props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teamId) fetchPayments();
  }, [teamId]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const data = await api(`/api/payments/team/${teamId}`);
      setPayments(data.payments ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => `$${Number(n).toLocaleString("es-MX")} ${currency}`;
  const info = payStatusInfo[payStatus] ?? payStatusInfo.PENDING;

  if (loading) {
    return <div className="animate-pulse bg-white/5 rounded-xl h-16 mt-3" />;
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={15} className="text-gray-400" />
          <span className="text-gray-300 text-sm font-medium">Estado de pago</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${info.cls}`}>
          {payStatus === "PAID" ? <CheckCircle size={12} /> : payStatus === "REFUNDED" ? <RefreshCw size={12} /> : <Clock size={12} />}
          {info.label}
        </span>
      </div>

      {regFee && payStatus !== "PAID" && (
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">Cuota de inscripción</span>
          <span className="text-white text-sm font-bold">{fmt(regFee)}</span>
        </div>
      )}

      {payments.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          {payments.slice(0, 3).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                {paymentStatusIcon[p.status as keyof typeof paymentStatusIcon] ?? <Clock size={12} />}
                <span>{methodLabel[p.method] ?? p.method}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span>{fmt(Number(p.amount))}</span>
                <span className="text-gray-600">
                  {new Date(p.createdAt).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {payStatus !== "PAID" && onPay && (
        <button
          onClick={onPay}
          className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold py-2 rounded-lg transition-all text-sm"
        >
          Pagar inscripción
        </button>
      )}
    </div>
  );
}
