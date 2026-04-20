import { useState } from "react";
import { useRouter } from "next/router";
import { Trophy, User, ArrowRight, FcFootball } from "lucide-react";
import { toast } from "sonner";

export default function WelcomeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const roles = [
    { id: "PLAYER", icon: "⚽", label: "Jugador", desc: "Explorar torneos, inscribirme, ver resultados" },
    { id: "REFEREE", icon: "🟨", label: "Árbitro", desc: "Arbitrar partidos, anotar en vivo" },
    { id: "ORGANIZER", icon: "👔", label: "Organizador", desc: "Crear torneos, cobrar, gestionar equipos" },
  ];

  const handleRoleSelect = (role) => {
    setSelected(role);
    router.push(`/auth/register?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 mb-4">
            <FcFootball size={48} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-1">El Pitazo</h1>
          <p className="text-blue-300 text-lg">La app que organiza tu torneo</p>
        </div>

        {/* Role selector */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-2">¿Cómo quieres usar El Pitazo?</h2>
          <p className="text-gray-400 text-sm mb-5">Selecciona tu rol para comenzar</p>

          <div className="space-y-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left group"
              >
                <div className="text-3xl">{role.icon}</div>
                <div className="flex-1">
                  <div className="text-white font-semibold">{role.label}</div>
                  <div className="text-gray-400 text-sm">{role.desc}</div>
                </div>
                <ArrowRight className="text-gray-600 group-hover:text-blue-400 transition-colors" />
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Ya tengo cuenta — Iniciar Sesión
            </button>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-6 text-gray-500 text-xs">
          <span>🔒 Pagos seguros</span>
          <span>⚡ Tiempos real</span>
          <span>🇲🇽 LATAM</span>
        </div>
      </div>
    </div>
  );
}
