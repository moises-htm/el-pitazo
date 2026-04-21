import { useRouter } from "next/router";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-pitch-grid text-white overflow-hidden">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-display font-black text-xl uppercase tracking-widest">El Pitazo</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/feed")}
            className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-white text-sm font-display uppercase tracking-wide transition-colors"
          >
            <Play size={14} fill="currentColor" /> Feed
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className="text-gray-400 hover:text-white text-sm font-display uppercase tracking-wide transition-colors px-4 py-2"
          >
            Entrar
          </button>
          <button
            onClick={() => router.push("/auth/register")}
            className="btn-neon px-5 py-2 rounded-lg text-sm"
          >
            Registrarse
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            <span className="text-[#39FF14] text-xs font-display uppercase tracking-widest">Plataforma #1 para fútbol amateur</span>
          </div>

          <h1 className="font-display font-black uppercase leading-none text-white mb-6">
            <span className="block text-[clamp(4rem,12vw,9rem)] tracking-tight">JUEGA.</span>
            <span className="block text-[clamp(4rem,12vw,9rem)] tracking-tight text-[#39FF14]" style={{ textShadow: '0 0 40px rgba(57,255,20,0.4)' }}>COMPITE.</span>
            <span className="block text-[clamp(4rem,12vw,9rem)] tracking-tight">GANA.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
            Crea torneos, gestiona equipos y sigue cada partido en tiempo real. Para jugadores, árbitros y organizadores.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/auth/register")}
              className="btn-neon px-8 py-4 rounded-xl text-base flex items-center justify-center gap-2"
            >
              EMPEZAR GRATIS <ArrowRight size={18} />
            </button>
            <button
              onClick={() => router.push("/feed")}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-8 py-4 rounded-xl font-display uppercase font-bold tracking-wide transition-all"
            >
              <Play size={16} fill="currentColor" /> Ver el feed
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-wrap gap-10">
          {[
            ["1,200+", "TORNEOS ACTIVOS"],
            ["48,000+", "JUGADORES"],
            ["150+", "CIUDADES"],
            ["$2M+", "PAGOS PROCESADOS"],
          ].map(([num, label]) => (
            <div key={label}>
              <div className="score-number text-4xl md:text-5xl text-white">{num}</div>
              <div className="text-gray-500 text-xs tracking-widest uppercase font-display mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h2 className="font-display font-black text-5xl md:text-6xl uppercase text-white">TU POSICIÓN,<br /><span className="text-[#39FF14]">TU PANEL.</span></h2>
          <p className="text-gray-500 mt-3 text-base">Cada rol tiene su experiencia personalizada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "🏃",
              role: "JUGADOR",
              desc: "Únete a torneos, revisa tus estadísticas, gestiona tu credencial digital y sigue tus partidos.",
              q: "PLAYER",
              accent: "#39FF14",
            },
            {
              icon: "🟨",
              role: "ÁRBITRO",
              desc: "Gestiona tus partidos asignados, envía reportes y cobra tu fee por cada juego.",
              q: "REFEREE",
              accent: "#FACC15",
            },
            {
              icon: "👔",
              role: "ORGANIZADOR",
              desc: "Crea torneos, gestiona equipos, brackets, finanzas y comunicación.",
              q: "ORGANIZER",
              accent: "#60A5FA",
            },
          ].map((r) => (
            <button
              key={r.role}
              onClick={() => router.push(`/auth/register?role=${r.q}`)}
              className="card-glass card-glow text-left p-8 group transition-all hover:-translate-y-1"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="text-5xl mb-5">{r.icon}</div>
              <div
                className="font-display font-black text-3xl uppercase mb-3"
                style={{ color: r.accent }}
              >
                {r.role}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{r.desc}</p>
              <div className="flex items-center gap-1 mt-6 text-xs font-display uppercase tracking-widest" style={{ color: r.accent }}>
                Registrarse <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "⚡", title: "TIEMPO REAL", desc: "Resultados y estadísticas al instante" },
            { icon: "💳", title: "PAGOS LATAM", desc: "SPEI, Oxxo, MercadoPago, Stripe" },
            { icon: "📱", title: "CREDENCIAL DIGITAL", desc: "ID con QR para árbitros" },
            { icon: "🎬", title: "FEED DE GOLES", desc: "Comparte tus mejores jugadas" },
          ].map((f) => (
            <div key={f.title} className="card-glass card-glow p-6 text-center group">
              <div className="text-4xl mb-3">{f.icon}</div>
              <div className="font-display font-bold text-sm uppercase tracking-widest text-[#39FF14] mb-2">{f.title}</div>
              <p className="text-gray-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-[#39FF14]/5 border border-[#39FF14]/20 p-12 text-center">
          <div className="absolute inset-0 bg-pitch-grid opacity-30" />
          <div className="relative">
            <h2 className="font-display font-black text-5xl md:text-7xl uppercase text-white mb-4">
              ¿LISTO PARA<br /><span style={{ color: '#39FF14', textShadow: '0 0 30px rgba(57,255,20,0.5)' }}>JUGAR?</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg">Crea tu primer torneo en minutos.</p>
            <button
              onClick={() => router.push("/auth/register")}
              className="btn-neon px-12 py-4 rounded-xl text-lg inline-flex items-center gap-2"
            >
              COMENZAR AHORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-gray-600 text-sm font-display uppercase tracking-widest">
          El Pitazo © 2026 — Latinoamérica
        </p>
      </footer>
    </div>
  );
}
