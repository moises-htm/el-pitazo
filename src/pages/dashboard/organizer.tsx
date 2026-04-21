import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { TournamentCreate } from "@/components/tournament-create";
import { TeamList } from "@/components/team-list";
import { BracketView } from "@/components/bracket-view";
import { FinancialDashboard } from "@/components/financial-dashboard";
import { Users, Trophy, DollarSign, ClipboardList, BarChart3, Plus } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function OrganizerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("tournaments");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "tournaments", label: "Torneos", icon: <Trophy size={18} /> },
    { id: "teams", label: "Equipos", icon: <Users size={18} /> },
    { id: "brackets", label: "Cuadros", icon: <ClipboardList size={18} /> },
    { id: "financial", label: "Finanzas", icon: <DollarSign size={18} /> },
    { id: "analytics", label: "Métricas", icon: <BarChart3 size={18} /> },
  ];

  useEffect(() => {
    if (activeTab === "tournaments") fetchTournaments();
  }, [activeTab]);

  async function fetchTournaments() {
    setLoading(true);
    try {
      const data = await api("/api/tournaments?status=DRAFT&limit=50");
      const data2 = await api("/api/tournaments?status=ACTIVE&limit=50");
      setTournaments([...(data.tournaments || []), ...(data2.tournaments || [])]);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  const typeLabel = (t: string) => t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos" : "Swiss";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Organizador</p>
          </div>
          <span className="text-yellow-400">👔</span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-2">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {activeTab === "tournaments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Mis Torneos</h2>
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm">
                <Plus size={16} /> {showCreate ? "Cancelar" : "Nuevo Torneo"}
              </button>
            </div>
            {showCreate && (
              <TournamentCreate onCreated={(t) => { setTournaments((prev) => [t, ...prev]); setShowCreate(false); }} />
            )}
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : tournaments.length === 0 && !showCreate ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <Trophy size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-white font-semibold mb-1">Aún no tienes torneos</h3>
                <p className="text-gray-400 text-sm mb-4">Crea tu primer torneo para comenzar</p>
                <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                  Crear primer torneo
                </button>
              </div>
            ) : (
              tournaments.map((t: any) => (
                <div key={t.id}
                  onClick={() => setSelectedTournament(t)}
                  className={`bg-white/5 backdrop-blur-xl rounded-2xl p-5 border transition-all cursor-pointer ${selectedTournament?.id === t.id ? "border-blue-500/50" : "border-white/10 hover:border-white/20"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold">{t.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span>{typeLabel(t.type)}</span>
                        <span>Max {t.maxTeams} equipos</span>
                        {t.startDate && <span>{new Date(t.startDate).toLocaleDateString("es-MX")}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${t.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "teams" && <TeamList tournamentId={selectedTournament?.id} />}
        {activeTab === "brackets" && <BracketView tournamentId={selectedTournament?.id} />}
        {activeTab === "financial" && <FinancialDashboard tournamentId={selectedTournament?.id} />}
        {activeTab === "analytics" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Métricas del Torneo</h3>
            <p className="text-gray-400">{selectedTournament ? "Próximamente" : "Selecciona un torneo primero"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
