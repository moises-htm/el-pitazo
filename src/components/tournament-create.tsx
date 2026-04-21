import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function TournamentCreate({ onCreated }: { onCreated?: (t: any) => void }) {
  const [form, setForm] = useState({
    name: "",
    type: "KNOCKOUT",
    maxTeams: 16,
    startDate: "",
    regFee: 500,
    currency: "MXN",
    fieldLocation: "",
    fieldAddress: "",
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (form.maxTeams < 2) e.maxTeams = "Mínimo 2 equipos";
    if (form.regFee < 0) e.regFee = "El costo no puede ser negativo";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await api("/api/tournaments", {
        method: "POST",
        body: JSON.stringify({ ...form, status: "DRAFT" }),
      });
      toast.success("¡Torneo creado!");
      setForm({ name: "", type: "KNOCKOUT", maxTeams: 16, startDate: "", regFee: 500, currency: "MXN", fieldLocation: "", fieldAddress: "", isPublic: true });
      onCreated?.(data.tournament);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el torneo");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof errors) =>
    errors[key] ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500";

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h2 className="text-white font-bold text-lg mb-4">Crear Nuevo Torneo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre del torneo *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${field("name")}`}
              placeholder="Ej: Torneo Barrenderos CDMX" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Tipo de torneo *</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
              <option value="KNOCKOUT">Eliminatoria</option>
              <option value="LEAGUE">Liga</option>
              <option value="GROUPS">Grupos + Eliminatoria</option>
              <option value="SWISS">Swiss</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Máximo de equipos</label>
            <input type="number" min={2} max={128} value={form.maxTeams} onChange={(e) => setForm({ ...form, maxTeams: parseInt(e.target.value) || 2 })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${field("maxTeams")}`} />
            {errors.maxTeams && <p className="text-red-400 text-xs mt-1">{errors.maxTeams}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Fecha de inicio</label>
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Costo de inscripción</label>
            <input type="number" min={0} value={form.regFee} onChange={(e) => setForm({ ...form, regFee: parseFloat(e.target.value) || 0 })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${field("regFee")}`} />
            {errors.regFee && <p className="text-red-400 text-xs mt-1">{errors.regFee}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Moneda</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
              <option value="MXN">MXN — Peso Mexicano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Ubicación del campo</label>
            <input type="text" value={form.fieldLocation} onChange={(e) => setForm({ ...form, fieldLocation: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Nombre del campo" />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Dirección del campo</label>
            <input type="text" value={form.fieldAddress} onChange={(e) => setForm({ ...form, fieldAddress: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Calle, colonia, ciudad" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50">
          {loading ? "Creando..." : "Crear Torneo"}
        </button>
      </form>
    </div>
  );
}
