import { useRouter } from "next/router";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-pitch-grid text-white overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/5 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-emerald-600/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 right-1/3 w-64 h-64 rounded-full bg-green-400/3 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Floating decorative balls */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-[15%] right-[8%] text-6xl opacity-5 blur-sm rotate-12">⚽</span>
        <span className="absolute top-[60%] left-[5%] text-4xl opacity-5 blur-sm -rotate-6">⚽</span>
        <span className="absolute bottom-[20%] right-[15%] text-5xl opacity-4 blur-sm rotate-45">⚽</span>
      </div>

      {/* NAV */}
      <nav className="relative flex items-center justify-between px-6 py-5 max-w-7xl mx-auto animate-fade-in-up">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-display font-black text-xl uppercase tracking-widest">El Pitazo</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/feed")}
            className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-white text-sm font-display uppercase tracking-wide transition-all duration-300"
          >
            <Play size={14} fill="currentColor" /> Feed
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className="text-gray-400 hover:text-white text-sm font-display uppercase tracking-wide transition-all duration-300 px-4 py-2"
          >
            Entrar
          </button>
          <button
            onClick={() => router.push("/auth/register")}
            className="btn-neon px-5 py-2 rounded-xl text-sm active:scale-95 transition-transform"
          >
            Registrarse
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            <span className="text-[#39FF14] text-xs font-display uppercase tracking-widest">Plataforma #1 para fútbol amateur</span>
          </div>

          <h1 className="font-display font-black uppercase leading-none text-white mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <span className="block text-[clamp(4rem,12vw,9rem)] tracking-tight">JUEGA.</span>
            <span className="block text-[clamp(4rem,12vw,9rem)] tracking-tight text-[#39FF14]" style={{ textShadow: "0 0 40px rgba(57,255,20,0.4)" }}>COMPITE.</span>
            <span className="block text-[clamp(4rem,12vw,9rem)] tracking-tight">GANA.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-lg mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Crea torneos, gestiona equipos y sigue cada partido en tiempo real. Para jugadores, árbitros y organizadores.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <button
              onClick={() => router.push("/auth/register")}
              className="btn-neon px-8 py-4 rounded-2xl text-base flex items-center justify-center gap-2 animate-pulse-glow active:scale-95 transition-transform"
            >
              EMPEZAR GRATIS <ArrowRight size={18} />
            </button>
            <button
              onClick={() => router.push("/feed")}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-8 py-4 rounded-2xl font-display uppercase font-bold tracking-wide transition-all duration-300 active:scale-95"
            >
              <Play size={16} fill="currentColor" /> Ver el feed
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          {[
            ["1,200+", "TORNEOS ACTIVOS"],
            ["48,000+", "JUGADORES"],
            ["150+", "CIUDADES"],
            ["$2M+", "PAGOS PROCESADOS"],
          ].map(([num, label]) => (
            <div key={label} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="score-number text-3xl md:text-4xl text-white">{num}</div>
              <div className="text-gray-500 text-[10px] tracking-widest uppercase font-display mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10 animate-fade-in-up">
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
              delay: "0s",
            },
            {
              icon: "🟨",
              role: "ÁRBITRO",
              desc: "Gestiona tus partidos asignados, envía reportes y cobra tu fee por cada juego.",
              q: "REFEREE",
              accent: "#FACC15",
              delay: "0.1s",
            },
            {
              icon: "👔",
              role: "ORGANIZADOR",
              desc: "Crea torneos, gestiona equipos, brackets, finanzas y comunicación.",
              q: "ORGANIZER",
              accent: "#60A5FA",
              delay: "0.2s",
            },
          ].map((r) => (
            <button
              key={r.role}
              onClick={() => router.push(`/auth/register?role=${r.q}`)}
              className="card-glass card-glow text-left p-8 rounded-2xl group transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] animate-fade-in-up"
              style={{ borderColor: "rgba(255,255,255,0.08)", animationDelay: r.delay }}
            >
              <div className="text-5xl mb-5">{r.icon}</div>
              <div
                className="font-display font-black text-3xl uppercase mb-3"
                style={{ color: r.accent }}
              >
                {r.role}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{r.desc}</p>
              <div className="flex items-center gap-1 mt-6 text-xs font-display uppercase tracking-widest transition-all duration-300 group-hover:translate-x-1" style={{ color: r.accent }}>
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
            { icon: "⚡", title: "TIEMPO REAL", desc: "Resultados y estadísticas al instante", color: "#39FF14" },
            { icon: "💳", title: "PAGOS LATAM", desc: "SPEI, Oxxo, MercadoPago, Stripe", color: "#60A5FA" },
            { icon: "📱", title: "CREDENCIAL DIGITAL", desc: "ID con QR para árbitros", color: "#FACC15" },
            { icon: "🎬", title: "FEED DE GOLES", desc: "Comparte tus mejores jugadas", color: "#F472B6" },
          ].map((f, i) => (
            <div
              key={f.title}
              className="card-glass card-glow p-6 text-center rounded-2xl group transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}
              >
                {f.icon}
              </div>
              <div className="font-display font-bold text-sm uppercase tracking-widest mb-2" style={{ color: f.color }}>{f.title}</div>
              <p className="text-gray-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-[#39FF14]/20 p-12 text-center animate-pulse-glow">
          <div className="absolute inset-0 bg-pitch-grid opacity-20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-[#39FF14]/40 to-transparent" />
          <div className="relative">
            <h2 className="font-display font-black text-5xl md:text-7xl uppercase text-white mb-4">
              ¿LISTO PARA<br /><span style={{ color: "#39FF14", textShadow: "0 0 30px rgba(57,255,20,0.5)" }}>JUGAR?</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg">Crea tu primer torneo en minutos.</p>
            <button
              onClick={() => router.push("/auth/register")}
              className="btn-neon px-12 py-4 rounded-2xl text-lg inline-flex items-center gap-2 active:scale-95 transition-transform"
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
