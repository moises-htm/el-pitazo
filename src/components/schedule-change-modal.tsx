import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Calendar, X } from "lucide-react";

interface Props {
  matchId: string;
  matchInfo: string; // e.g. "Equipo A vs Equipo B"
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleChangeModal({ matchId, matchInfo, onClose, onSuccess }: Props) {
  const [proposedTime, setProposedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!proposedTime) { toast.error("Selecciona fecha y hora"); return; }
    setLoading(true);
    try {
      await api("/api/schedule-change", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ matchId, proposedTime, reason }),
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Solicitud enviada. Esperando aprobaciones.");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar solicitud");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Calendar size={18} /> Proponer cambio de horario
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-400 text-sm mb-4">{matchInfo}</p>
        <div className="space-y-3">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Nueva fecha y hora</label>
            <input
              type="datetime-local"
              value={proposedTime}
              onChange={e => setProposedTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Motivo (opcional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Conflicto con otro torneo"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none"
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold transition-all">
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}
