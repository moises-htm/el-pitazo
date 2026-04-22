import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Clock, DollarSign, ClipboardList, TrendingUp, MapPin, QrCode } from "lucide-react";
import { toast } from "sonner";
import { LocationMap } from "@/components/location-map";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function RefereeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("today");
  const [matches, setMatches] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeTab === "today") fetchMatches();
    if (activeTab === "earnings" || activeTab === "stats" || activeTab === "history") fetchEarnings();
  }, [activeTab]);

  async function fetchMatches() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/referee/schedule");
      setMatches(data.matches || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEarnings() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/referee/earnings");
      setEarnings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "today", label: "Hoy", icon: <Clock size={16} /> },
    { id: "history", label: "Historial", icon: <ClipboardList size={16} /> },
    { id: "earnings", label: "Ganancias", icon: <DollarSign size={16} /> },
    { id: "stats", label: "Estadísticas", icon: <TrendingUp size={16} /> },
  ];

  const formatTime = (iso: string | null) => {
    if (!iso) return "Hora por definir";
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-pitch-grid animate-fade-in-up">
      <div className="px-6 pt-6 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border border-yellow-500/20 rounded-3xl p-6 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
              <p className="text-gray-400 text-sm">Panel de Árbitro</p>
            </div>
            <span className="text-yellow-400 text-2xl">🟨</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex gap-1 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeTab === tab.id ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "text-gray-500 hover:text-gray-300"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {activeTab === "today" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg mb-4">
              {loading ? "Cargando partidos..." : `Partidos de hoy (${matches.length})`}
            </h2>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />)
            ) : matches.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-white font-semibold mb-1">Sin partidos hoy</h3>
                <p className="text-gray-400 text-sm">Revisa mañana o contacta al organizador</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all duration-300 border-l-4 ${match.status === "in_progress" ? "border-l-green-500" : match.status === "completed" ? "border-l-gray-500" : "border-l-yellow-500"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-yellow-400 text-sm font-mono">{formatTime(match.time)}</span>
                    {match.status === "in_progress" ? (
                      <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full text-xs animate-pulse">⏱ EN CURSO</span>
                    ) : match.status === "completed" ? (
                      <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-2 py-0.5 rounded-full text-xs">COMPLETADO</span>
                    ) : (
                      <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full text-xs">PENDIENTE</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{match.home}</div>
                      <div className="text-gray-500 text-sm">local</div>
                    </div>
                    <div className="text-gray-400 font-bold">VS</div>
                    <div className="text-right">
                      <div className="text-white font-bold">{match.away}</div>
                      <div className="text-gray-500 text-sm">visitante</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={14} />{match.field}</span>
                    <span>{match.tournament}</span>
                  </div>
                  {(match.fieldLat || match.fieldAddress) && (
                    <div className="mt-3">
                      <LocationMap lat={match.fieldLat} lng={match.fieldLng} address={match.fieldAddress} name={match.field} compact />
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => toast.success("Asistencia confirmada")}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-xl font-semibold transition-all text-sm active:scale-95 transition-transform">
                      Confirmar asistencia
                    </button>
                    <button
                      onClick={() => toast.info("Detalle de partido — próximamente")}
                      className="bg-white/5 hover:bg-white/10 text-white py-2 px-4 rounded-lg transition-all text-sm border border-white/10 active:scale-95 transition-transform">
                      Detalles
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/20 transition-all duration-300 text-center">
            <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Historial de arbitrajes</h3>
            <p className="text-gray-400">
              {earnings ? `${earnings.totalMatches} partidos arbitrados en total` : "Cargando..."}
            </p>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : earnings ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/20 transition-all duration-300 text-center">
                    <DollarSign size={24} className="mx-auto text-green-400 mb-2" />
                    <div className="text-2xl font-bold text-white">${earnings.total.toLocaleString("es-MX")}</div>
                    <div className="text-gray-400 text-sm">Total ganado</div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-yellow-500/20 transition-all duration-300 text-center">
                    <DollarSign size={24} className="mx-auto text-yellow-400 mb-2" />
                    <div className="text-2xl font-bold text-white">${earnings.pending.toLocaleString("es-MX")}</div>
                    <div className="text-gray-400 text-sm">Pendiente</div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/20 transition-all duration-300 text-center">
                    <DollarSign size={24} className="mx-auto text-blue-400 mb-2" />
                    <div className="text-2xl font-bold text-white">${earnings.paid.toLocaleString("es-MX")}</div>
                    <div className="text-gray-400 text-sm">Pagado</div>
                  </div>
                </div>
                {earnings.pending === 0 ? (
                  <p className="text-gray-400 text-sm text-center">Sin pagos pendientes</p>
                ) : (
                  <button
                    onClick={() => toast.info("Retiro SPEI — próximamente")}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-2xl font-semibold transition-all active:scale-95 transition-transform">
                    Solicitar retiro SPEI — ${earnings.pending.toLocaleString("es-MX")}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400">No se pudo cargar las ganancias</div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/20 transition-all duration-300">
            {loading ? (
              <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : earnings ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-white">{earnings.totalMatches}</div>
                  <div className="text-gray-400 text-sm">Total partidos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-400">—</div>
                  <div className="text-gray-400 text-sm">Rating promedio</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">${earnings.total.toLocaleString("es-MX")}</div>
                  <div className="text-gray-400 text-sm">Ganancias totales</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">No se pudo cargar las estadísticas</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
