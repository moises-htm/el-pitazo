import { useRouter } from "next/router";
import { ArrowRight, Volleyball as Football } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const features = [
    { icon: "⚽", title: "Gestión Completa", desc: "Crea torneos, gestiona equipos, emparejamientos y resultados en tiempo real" },
    { icon: "💳", title: "Pagos LATAM", desc: "SPEI, Oxxo, MercadoPago y Stripe — los métodos que tus jugadores necesitan" },
    { icon: "📊", title: "Panel por Rol", desc: "Vistas personalizadas para jugadores, árbitros y organizadores" },
    { icon: "🔄", title: "Tiempo Real", desc: "Resultados, estadísticas y actualizaciones instantáneas vía WebSocket" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Football size={48} className="text-emerald-400" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              El Pitazo
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            La plataforma completa para torneos de fútbol amateur en Latinoamérica
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push("/auth/register")}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-colors"
            >
              Registrarse gratis
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
            >
              Ya tengo cuenta
            </button>
            <button
              onClick={() => router.push("/feed")}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              🎬 Ver el feed
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((f) => (
            <div key={f.title} className="p-6 bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-colors">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Para cada rol</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { role: "Jugador", icon: "🏃", desc: "Únete a torneos, revisa resultados y estadísticas", q: "PLAYER" },
            { role: "Árbitro", icon: "🟨", desc: "Gestiona partidos, envía reportes y cobra por juego", q: "REFEREE" },
            { role: "Organizador", icon: "👔", desc: "Crea torneos, gestiona equipos y finanzas", q: "ORGANIZER" },
          ].map((r) => (
            <button
              key={r.role}
              onClick={() => router.push(`/auth/register?role=${r.q}`)}
              className="p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-colors text-left"
            >
              <div className="text-5xl mb-4">{r.icon}</div>
              <h3 className="text-xl font-bold mb-2">{r.role}</h3>
              <p className="text-gray-400">{r.desc}</p>
            </button>
          ))}
        </div>

        <div className="text-center p-12 bg-gradient-to-r from-emerald-900/50 to-teal-900/30 rounded-3xl border border-emerald-700/30">
          <h2 className="text-3xl font-bold mb-4">¿Listo para jugar?</h2>
          <p className="text-gray-400 mb-8">Crea tu primer torneo en minutos y empieza a jugar</p>
          <button
            onClick={() => router.push("/auth/register")}
            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-lg transition-colors inline-flex items-center gap-2"
          >
            Comenzar Ahora <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
