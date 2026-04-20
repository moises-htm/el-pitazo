import { useState } from "react";
import { useAuthStore } from "../stores/auth";
import { TournamentCreate } from "../components/tournament-create";
import { TeamList } from "../components/team-list";
import { BracketView } from "../components/bracket-view";
import { FinancialDashboard } from "../components/financial-dashboard";
import { Users, Trophy, DollarSign, ClipboardList, BarChart3 } from "lucide-react";

export default function OrganizerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("tournaments");

  const tabs = [
    { id: "tournaments", label: "Torneos", icon: <Trophy size={18} /> },
    { id: "teams", label: "Equipos", icon: <Users size={18} /> },
    { id: "brackets", label: "Cuadros", icon: <ClipboardList size={18} /> },
    { id: "financial", label: "Finanzas", icon: <DollarSign size={18} /> },
    { id: "analytics", label: "Métricas", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Organizador</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400">👔</span>
            <span className="text-white text-sm">Organizador</span>
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
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
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
        {activeTab === "tournaments" && <TournamentCreate />}
        {activeTab === "teams" && <TeamList />}
        {activeTab === "brackets" && <BracketView />}
        {activeTab === "financial" && <FinancialDashboard />}
        {activeTab === "analytics" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Métricas del Torneo</h3>
            <p className="text-gray-400">Crea un torneo para ver las métricas</p>
          </div>
        )}
      </div>
    </div>
  );
}
