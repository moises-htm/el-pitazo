import { useState } from "react";
import { useAuthStore } from "../stores/auth";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

export function TournamentCreate() {
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
  const [created, setCreated] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // API call to create tournament
    setTimeout(() => {
      setLoading(false);
      setCreated(true);
    }, 1000);
  };

  if (created) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-white text-lg font-bold mb-1">¡Torneo creado!</h3>
        <p className="text-gray-400 mb-4">Comparte el QR para que los equipos se inscriban</p>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold">Compartir QR</button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h2 className="text-white font-bold text-lg mb-4">Crear Nuevo Torneo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre del torneo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Ej: Torneo Barrenderos CDMX"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Tipo de torneo *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="LEAGUE">Liga</option>
              <option value="KNOCKOUT">Eliminatoria</option>
              <option value="GROUPS">Grupos + Eliminatoria</option>
              <option value="SWISS">Swiss</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Máximo de equipos</label>
            <input
              type="number"
              value={form.maxTeams}
              onChange={(e) => setForm({ ...form, maxTeams: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Fecha de inicio</label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Costo de inscripción</label>
            <input
              type="number"
              value={form.regFee}
              onChange={(e) => setForm({ ...form, regFee: parseFloat(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Moneda</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Ubicación del campo</label>
            <input
              type="text"
              value={form.fieldLocation}
              onChange={(e) => setForm({ ...form, fieldLocation: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Nombre del campo"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Dirección del campo</label>
            <input
              type="text"
              value={form.fieldAddress}
              onChange={(e) => setForm({ ...form, fieldAddress: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Calle, colonia, ciudad"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Torneo"}
        </button>
      </form>
    </div>
  );
}
