import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { Gavel, Clock, MapPin, DollarSign, ClipboardList, TrendingUp } from "lucide-react";

export default function RefereeDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("today");

  // Mock matches for today
  const todayMatches = [
    { id: "1", time: "09:00", field: "Campo 1", home: "Los Gallos", away: "Los Leones", tournament: "Torneo Barrenderos", status: "scheduled" },
    { id: "2", time: "10:30", field: "Campo 2", home: "Los Rayados", away: "Los Tigres", tournament: "Torneo Barrenderos", status: "scheduled" },
    { id: "3", time: "12:00", field: "Campo 3", home: "Los Águilas", away: "Los Halcones", tournament: "Copa Guadalajara", status: "in_progress" },
  ];

  const myEarnings = { total: 4500, pending: 800, paid: 3700 };
  const myStats = { totalMatches: 47, avgRating: 4.8, thisMonth: 12 };

  const tabs = [
    { id: "today", label: "Hoy", icon: <Clock size={16} /> },
    { id: "history", label: "Historial", icon: <ClipboardList size={16} /> },
    { id: "earnings", label: "Ganancias", icon: <DollarSign size={16} /> },
    { id: "stats", label: "Estadísticas", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-yellow-950 to-gray-950">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Árbitro</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-2xl">🟨</span>
            <span className="text-white text-sm">Árbitro</span>
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-yellow-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === "today" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg mb-4">Partidos de hoy ({todayMatches.length})</h2>
            {todayMatches.map((match) => (
              <div key={match.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-yellow-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-yellow-400 text-sm font-mono">{match.time}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    match.status === "in_progress" ? "bg-green-500/20 text-green-400" :
                    match.status === "scheduled" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {match.status === "in_progress" ? "⏱ En juego" : match.status === "scheduled" ? "📋 Programado" : "🔴 En vivo"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🏠</div>
                    <div>
                      <div className="text-white font-bold">{match.home}</div>
                      <div className="text-gray-500 text-sm">local</div>
                    </div>
                  </div>
                  <div className="text-gray-400 font-bold text-lg">VS</div>
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="text-2xl">✈️</div>
                    <div className="text-right">
                      <div className="text-white font-bold">{match.away}</div>
                      <div className="text-gray-500 text-sm">visitante</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><MapPin size={14} />{match.field}</span>
                  <span>{match.tournament}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-semibold transition-all text-sm">
                    Confirmar asistencia
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 text-white py-2 px-4 rounded-lg transition-all text-sm border border-white/10">
                    Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Historial de arbitrajes</h3>
            <p className="text-gray-400">Tus últimos {myStats.totalMatches} partidos arbitrados</p>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
                <DollarSign size={24} className="mx-auto text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">${myEarnings.total}</div>
                <div className="text-gray-400 text-sm">Total ganado</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 text-center">
                <DollarSign size={24} className="mx-auto text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">${myEarnings.pending}</div>
                <div className="text-gray-400 text-sm">Pendiente</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 text-center">
                <DollarSign size={24} className="mx-auto text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">${myEarnings.paid}</div>
                <div className="text-gray-400 text-sm">Pagado</div>
              </div>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-semibold transition-all">
              Solicitar retiro SPEI
            </button>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-white">{myStats.totalMatches}</div>
                <div className="text-gray-400 text-sm">Total partidos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">⭐ {myStats.avgRating}</div>
                <div className="text-gray-400 text-sm">Rating promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{myStats.thisMonth}</div>
                <div className="text-gray-400 text-sm">Este mes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
