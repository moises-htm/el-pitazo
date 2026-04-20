import { useState } from "react";
import { Plus, Users, DollarSign, Filter, Search } from "lucide-react";

export function TeamList() {
  const [showForm, setShowForm] = useState(false);
  const [teams, setTeams] = useState([
    { id: "1", name: "Los Gallos", captain: "Carlos M.", players: 14, payStatus: "paid", color: "#3B82F6" },
    { id: "2", name: "Los Leones", captain: "Diego R.", players: 12, payStatus: "paid", color: "#EF4444" },
    { id: "3", name: "Los Rayados", captain: "Miguel S.", players: 10, payStatus: "pending", color: "#10B981" },
    { id: "4", name: "Los Tigres", captain: "Ana P.", players: 8, payStatus: "partial", color: "#F59E0B" },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Equipos ({teams.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all">
          <Plus size={18} /> Nuevo Equipo
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Registrar Equipo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Nombre del equipo" className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
            <input type="text" placeholder="Nombre del capitán" className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
            <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
              <option value="">Color del equipo</option>
              <option value="#3B82F6">🔵 Azul</option>
              <option value="#EF4444">🔴 Rojo</option>
              <option value="#10B981">🟢 Verde</option>
              <option value="#F59E0B">🟡 Amarillo</option>
              <option value="#8B5CF6">🟣 Morado</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold">Registrar</button>
            <button onClick={() => setShowForm(false)} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-lg">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.color }}>
                  {team.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold">{team.name}</div>
                  <div className="text-gray-400 text-sm">Capitán: {team.captain}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-gray-400 text-sm"><Users size={14} />{team.players}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  team.payStatus === "paid" ? "bg-green-500/20 text-green-400" :
                  team.payStatus === "partial" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {team.payStatus === "paid" ? "✓ Pagado" : team.payStatus === "partial" ? "⏳ Parcial" : "❌ Pendiente"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
