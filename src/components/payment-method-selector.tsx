import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CreditCard, Building2, Store, Loader2, ExternalLink, Copy } from "lucide-react";

interface Props {
  tournamentId: string;
  teamId: string;
  amount: number;
  currency?: string;
  onComplete?: () => void;
}

type Method = "MERCADOPAGO" | "OXXO" | "SPEI";

export function PaymentMethodSelector({ tournamentId, teamId, amount, currency = "MXN", onComplete }: Props) {
  const [selected, setSelected] = useState<Method | null>(null);
  const [loading, setLoading] = useState(false);
  const [oxxoResult, setOxxoResult] = useState<any>(null);
  const [speiResult, setSpeiResult] = useState<any>(null);

  const fmt = (n: number) => `$${Number(n).toLocaleString("es-MX")} ${currency}`;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));
  }

  async function handlePay() {
    if (!selected) return;
    setLoading(true);
    try {
      if (selected === "MERCADOPAGO") {
        const data = await api("/api/payments/mercadopago/create-preference", {
          method: "POST",
          body: JSON.stringify({ tournamentId, teamId }),
        });
        window.location.href = data.initPoint ?? data.sandboxInitPoint;
      } else if (selected === "OXXO") {
        const data = await api("/api/payments/oxxo/create", {
          method: "POST",
          body: JSON.stringify({ tournamentId, teamId }),
        });
        setOxxoResult(data);
      } else if (selected === "SPEI") {
        const data = await api("/api/payments/spei/create", {
          method: "POST",
          body: JSON.stringify({ tournamentId, teamId }),
        });
        setSpeiResult(data);
      }
    } catch (e: any) {
      toast.error(e.message || "Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  }

  if (oxxoResult) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Store size={20} className="text-yellow-400" />
            <h3 className="text-white font-bold">Voucher OXXO generado</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Paga <span className="text-white font-bold">{fmt(oxxoResult.amount)}</span> en cualquier tienda OXXO presentando este voucher.
          </p>
          {oxxoResult.voucherUrl && (
            <a
              href={oxxoResult.voucherUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl transition-all text-sm mb-3"
            >
              <ExternalLink size={16} />
              Ver voucher / Código de barras
            </a>
          )}
          {oxxoResult.expiresAt && (
            <p className="text-gray-500 text-xs text-center">
              Vence: {new Date(oxxoResult.expiresAt).toLocaleDateString("es-MX", { dateStyle: "long" })}
            </p>
          )}
        </div>
        <button
          onClick={() => { setOxxoResult(null); onComplete?.(); }}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl text-sm transition-all"
        >
          Listo
        </button>
      </div>
    );
  }

  if (speiResult) {
    return (
      <div className="space-y-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={20} className="text-green-400" />
            <h3 className="text-white font-bold">Transferencia SPEI</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Transfiere <span className="text-white font-bold">{fmt(speiResult.amount)}</span> con los datos siguientes:
          </p>
          {speiResult.clabe && (
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400 text-xs">CLABE interbancaria</p>
                <button onClick={() => copyToClipboard(speiResult.clabe, "CLABE")} className="text-gray-500 hover:text-green-400 transition-colors">
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-white font-mono font-bold text-lg tracking-wider">{speiResult.clabe}</p>
            </div>
          )}
          {speiResult.reference && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400 text-xs">Referencia</p>
                <button onClick={() => copyToClipboard(speiResult.reference, "Referencia")} className="text-gray-500 hover:text-green-400 transition-colors">
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-white font-mono font-bold">{speiResult.reference}</p>
            </div>
          )}
          {speiResult.expiresAt && (
            <p className="text-gray-500 text-xs mt-3 text-center">
              Vence: {new Date(speiResult.expiresAt).toLocaleDateString("es-MX", { dateStyle: "long" })}
            </p>
          )}
        </div>
        <button
          onClick={() => { setSpeiResult(null); onComplete?.(); }}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl text-sm transition-all"
        >
          Listo
        </button>
      </div>
    );
  }

  const methods: { id: Method; label: string; desc: string; icon: React.ReactNode; active: string }[] = [
    {
      id: "MERCADOPAGO",
      label: "MercadoPago",
      desc: "Tarjeta de crédito/débito, wallet MP",
      icon: <CreditCard size={22} className="text-blue-400" />,
      active: "border-blue-500/50 bg-blue-500/10",
    },
    {
      id: "OXXO",
      label: "OXXO Pay",
      desc: "Paga en efectivo en cualquier OXXO",
      icon: <Store size={22} className="text-yellow-400" />,
      active: "border-yellow-500/50 bg-yellow-500/10",
    },
    {
      id: "SPEI",
      label: "SPEI / Transferencia",
      desc: "Transferencia interbancaria, recibe CLABE",
      icon: <Building2 size={22} className="text-green-400" />,
      active: "border-green-500/50 bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold mb-0.5">Método de pago</h3>
        <p className="text-gray-400 text-sm">
          Total: <span className="text-green-400 font-bold">{fmt(amount)}</span>
        </p>
      </div>

      <div className="space-y-2">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              selected === m.id ? m.active : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
          >
            <div className="shrink-0">{m.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">{m.label}</div>
              <div className="text-gray-400 text-xs">{m.desc}</div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                selected === m.id ? "border-green-400 bg-green-400" : "border-gray-600"
              }`}
            />
          </button>
        ))}
      </div>

      <button
        onClick={handlePay}
        disabled={!selected || loading}
        className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Procesando...
          </>
        ) : (
          "Pagar ahora"
        )}
      </button>
    </div>
  );
}
