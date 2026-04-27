import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/lib/api";
import { CheckCircle2, Printer, ArrowLeft, Loader2 } from "lucide-react";

interface Payment {
  id: string;
  amount: string | number;
  currency: string;
  method: string;
  status: string;
  paidAt?: string | null;
  createdAt: string;
  tournament?: { name: string; fieldLocation?: string } | null;
  team?: { name: string } | null;
  user?: { name: string; email?: string | null } | null;
}

export default function ReceiptPage() {
  const router = useRouter();
  const { paymentId } = router.query as { paymentId: string };
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) return;
    api<{ payment: Payment }>(`/api/payments/${paymentId}/receipt`, { auth: false })
      .then((d) => setPayment(d.payment))
      .catch(() => setPayment(null))
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-400" /></div>;
  }
  if (!payment) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-black">Recibo no encontrado</div>;
  }

  const fmt = (n: number | string) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      <style jsx global>{`
        @media print { .no-print { display: none !important; } body { background: white !important; } }
      `}</style>

      <div className="max-w-md mx-auto">
        <div className="no-print flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="text-sm flex items-center gap-1.5 text-gray-700">
            <ArrowLeft size={16} /> Volver
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-black text-white text-sm font-bold flex items-center gap-2">
            <Printer size={16} /> Imprimir
          </button>
        </div>

        <div className="border-2 border-black rounded-2xl p-6">
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-widest text-gray-500">El Pitazo</p>
            <h1 className="font-black text-2xl uppercase">Recibo de Pago</h1>
            <p className="text-[10px] text-gray-500 mt-1">#{payment.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="flex items-center justify-center mb-6">
            {payment.status === "COMPLETED" ? (
              <div className="flex items-center gap-2 text-green-600 font-bold">
                <CheckCircle2 size={24} /> PAGADO
              </div>
            ) : (
              <span className="text-yellow-600 font-bold">{payment.status}</span>
            )}
          </div>

          <div className="space-y-2 text-sm border-y py-4 mb-4">
            <div className="flex justify-between"><span className="text-gray-500">Torneo</span><span className="font-semibold">{payment.tournament?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Equipo</span><span className="font-semibold">{payment.team?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pagador</span><span className="font-semibold">{payment.user?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Método</span><span className="font-semibold">{payment.method}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span className="font-semibold">{(payment.paidAt || payment.createdAt) ? new Date(payment.paidAt || payment.createdAt).toLocaleString("es-MX") : "—"}</span></div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-bold uppercase">Total</span>
            <span className="font-black text-3xl tabular-nums">{fmt(payment.amount)} <span className="text-sm font-normal">{payment.currency}</span></span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">Conserva este recibo como comprobante de pago.</p>
      </div>
    </div>
  );
}
