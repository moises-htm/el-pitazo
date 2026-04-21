import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function TeamList({ tournamentId }: { tournamentId?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", colorHex: "#3B82F6" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (tournamentId) fetchTeams();
    else setTeams([]);
  }, [tournamentId]);

  async function fetchTeams() {
    setLoading(true);
    try {
      const data = await api(`/api/tournaments/${tournamentId}/teams`);
      setTeams(data.teams || []);
    } catch { setTeams([]); }
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("El nombre es obligatorio"); return; }
    if (!tournamentId) { toast.error("Selecciona un torneo primero"); return; }
    setSaving(true);
    setFormError("");
    try {
      const data = await api(`/api/tournaments/${tournamentId}/teams`, {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), colorHex: form.colorHex, payAmount: 0 }),
      });
      setTeams((prev) => [...prev, data.team]);
      setForm({ name: "", colorHex: "#3B82F6" });
      setShowForm(false);
      toast.success("Equipo registrado");
    } catch (err: any) {
      setFormError(err.message || "Error al registrar el equipo");
    } finally {
      setSaving(false);
    }
  }

  const colors = [
    { hex: "#3B82F6", label: "🔵" }, { hex: "#EF4444", label: "🔴" },
    { hex: "#10B981", label: "🟢" }, { hex: "#F59E0B", label: "🟡" },
    { hex: "#8B5CF6", label: "🟣" }, { hex: "#F97316", label: "🟠" },
  ];

  if (!tournamentId) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <Users size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Selecciona un torneo</h3>
        <p className="text-gray-400 text-sm">Ve a la pestaña Torneos y selecciona uno para gestionar sus equipos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Equipos{teams.length > 0 ? ` (${teams.length})` : ""}</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm">
          <Plus size={16} /> Nuevo Equipo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-white font-semibold">Registrar Equipo</h3>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre del equipo *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Ej: Los Gallos" />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Color del equipo</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button key={c.hex} type="button" onClick={() => setForm({ ...form, colorHex: c.hex })}
                  className={`w-10 h-10 rounded-full text-lg flex items-center justify-center transition-all ${form.colorHex === c.hex ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
                  style={{ backgroundColor: c.hex }}>
                  {form.colorHex === c.hex ? "✓" : ""}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50">
              {saving ? "Guardando..." : "Registrar"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError(""); }}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-lg transition-all">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
      ) : teams.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
          <Users size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-white font-semibold mb-1">Sin equipos registrados</h3>
          <p className="text-gray-400 text-sm">Agrega el primer equipo para comenzar el torneo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((team: any) => (
            <div key={team.id} className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.colorHex || "#3B82F6" }}>
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{team.name}</div>
                    {team.captain && <div className="text-gray-400 text-sm">Capitán: {team.captain.name}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-gray-400 text-sm"><Users size={14} />{team.playersCount}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    team.payStatus === "PAID" ? "bg-green-500/20 text-green-400" :
                    team.payStatus === "PARTIAL" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {team.payStatus === "PAID" ? "✓ Pagado" : team.payStatus === "PARTIAL" ? "⏳ Parcial" : "❌ Pendiente"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
