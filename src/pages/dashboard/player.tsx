import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { Trophy, Search, MapPin, DollarSign, ArrowRight, Star, Clock } from "lucide-react";

export default function PlayerDashboard() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("browse");

  // Mock data — connected to real API later
  const tournaments = [
    { id: "1", name: "Torneo Barrenderos CDMX", type: "KNOCKOUT", startDate: "2026-04-25", fieldLocation: "Campo Universitario, CDMX", price: 500, currency: "MXN", teams: "8/16", rating: 4.5, skillLevel: 3 },
    { id: "2", name: "Liga Femenil 7v7", type: "LEAGUE", startDate: "2026-05-01", fieldLocation: "Cancha del Bosque, CDMX", price: 300, currency: "MXN", teams: "12/20", rating: 4.8, skillLevel: 2 },
    { id: "3", name: "Copa Guadalajara Open", type: "GROUPS", startDate: "2026-04-28", fieldLocation: "Centro Deportivo Tapatío, GDL", price: 750, currency: "MXN", teams: "16/32", rating: 4.2, skillLevel: 4 },
    { id: "4", name: "Torneo Amigos Monterrey", type: "SWISS", startDate: "2026-05-05", fieldLocation: "Parque Fundidora, MTY", price: 400, currency: "MXN", teams: "6/16", rating: 4.0, skillLevel: 2 },
  ];

  const myTournaments = [
    { id: "5", name: "Torneo del Barrio", status: "ACTIVE", round: "Semana 2", nextMatch: "Sábado 10am, Campo 3", myTeam: "Los Indios" },
    { id: "6", name: "Copa Verano", status: "COMPLETED", result: "Subcampeón", date: "Ago 2025" },
  ];

  const tabs = [
    { id: "browse", label: "Explorar" },
    { id: "my", label: "Mis Torneos" },
    { id: "stats", label: "Mis Stats" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Jugador</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400">⚽</span>
            <span className="text-white text-sm">Jugador</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-2">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === "browse" && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar torneos, equipos, campos..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Tournaments grid */}
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg">Torneos disponibles</h2>
              {tournaments.map((t) => (
                <div key={t.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy size={16} className="text-yellow-400" />
                        <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">{t.type === "KNOCKOUT" ? "Eliminatoria" : t.type === "LEAGUE" ? "Liga" : t.type === "GROUPS" ? "Grupos+Elim" : "Swiss"}</span>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-1">{t.name}</h3>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <span className="flex items-center gap-1"><MapPin size={14} />{t.fieldLocation}</span>
                        <span className="flex items-center gap-1"><Clock size={14} />{t.startDate}</span>
                        <span className="flex items-center gap-1"><DollarSign size={14} />{t.price} {t.currency}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-gray-500">Equipos: {t.teams}</span>
                        <span className="text-gray-500">Nivel: {'⭐'.repeat(t.skillLevel)}</span>
                        <span className="text-yellow-400">{'⭐'.repeat(Math.floor(t.rating))} {t.rating}</span>
                      </div>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold transition-all group-hover:scale-105">
                      Inscribirse
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "my" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg">Mis Torneos</h2>
            {myTournaments.map((t) => (
              <div key={t.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-bold text-lg">{t.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${t.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {t.status === "ACTIVE" ? "🟢 Activo" : "✅ Completado"}
                  </span>
                  <span className="text-gray-400 text-sm">{t.round || t.result}</span>
                  <span className="text-gray-400 text-sm">{t.nextMatch || t.date}</span>
                </div>
                <div className="mt-3 text-sm text-gray-400">Equipo: <span className="text-white font-semibold">{t.myTeam}</span></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">23</div>
                <div className="text-gray-400 text-sm">Partidos</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-gray-400 text-sm">Goles</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-gray-400 text-sm">Asistencias</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">1</div>
                <div className="text-gray-400 text-sm">Rojas</div>
              </div>
            </div>
            <h3 className="text-white font-semibold mb-3">Últimos Torneos</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Copa Verano 2025</span>
                <span className="text-yellow-400">Subcampeón</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Liga de Barrio</span>
                <span className="text-green-400">Campeón</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
