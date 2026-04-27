import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "MX",
    lang: "es",
    role: "PLAYER" as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pwStrength, setPwStrength] = useState(0);

  useEffect(() => {
    const q = router.query.role as string | undefined;
    if (q && ["PLAYER", "REFEREE", "ORGANIZER"].includes(q)) {
      setForm((f) => ({ ...f, role: q }));
    }
  }, [router.query.role]);

  const calcStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++;
    return s;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError("Las contraseñas no coinciden");
    if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (!form.name.trim()) return setError("El nombre es obligatorio");
    if (!form.phone && !form.email) return setError("Necesitas teléfono o email");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      return setError("Email no válido");
    }
    if (form.phone && !/^\+?[0-9]{7,15}$/.test(form.phone.replace(/[\s-()]/g, ""))) {
      return setError("Teléfono no válido");
    }

    setLoading(true);
    setError("");
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload as any);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-[#39FF14]"];
  const strengthLabels = ["", "DÉBIL", "REGULAR", "FUERTE"];

  const roles = [
    { id: "PLAYER", label: "JUGADOR", icon: "⚽" },
    { id: "REFEREE", label: "ÁRBITRO", icon: "🟨" },
    { id: "ORGANIZER", label: "ORGANIZADOR", icon: "👔" },
  ];

  return (
    <div className="min-h-screen bg-pitch-grid flex">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-600/5 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* LEFT PANEL — hero text (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 relative overflow-hidden">
        {/* Decorative neon line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-neon to-transparent opacity-20" />

        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-12">
            <span className="text-4xl">⚽</span>
            <span className="font-display font-black text-2xl tracking-widest uppercase text-white">El Pitazo</span>
          </div>

          <h1 className="font-display font-black text-[7rem] leading-none uppercase tracking-tight text-white mb-4">
            ÚNETE.<br />
            <span className="text-neon-glow">COMPITE.</span><br />
            TRIUNFA.
          </h1>

          <p className="text-gray-400 text-xl mt-8 font-light max-w-xs">
            Únete a miles de jugadores, árbitros y organizadores en toda Latinoamérica.
          </p>

          {/* Stats bar */}
          <div className="flex gap-8 mt-12">
            {[["1.2K+", "TORNEOS"], ["48K+", "JUGADORES"], ["150+", "CIUDADES"]].map(([num, label]) => (
              <div key={label}>
                <div className="score-number text-3xl text-neon">{num}</div>
                <div className="text-gray-500 text-xs tracking-widest uppercase font-display">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8 self-start animate-fade-in-up">
          <span className="text-2xl">⚽</span>
          <span className="font-display font-black text-xl uppercase tracking-widest text-white">El Pitazo</span>
        </div>

        <div className="w-full max-w-sm animate-fade-in-up lg:glass lg:rounded-3xl lg:p-8">
          <div className="mb-8">
            <h2 className="font-display font-black text-5xl uppercase text-white mb-1">REGISTRO</h2>
            <p className="text-gray-500 text-sm">Crea tu cuenta y entra al campo</p>
          </div>

          {/* Role selector */}
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <label className="text-gray-400 text-xs uppercase tracking-widest font-display block mb-3">¿Cómo vas a jugar?</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.id })}
                  className={`p-3 rounded-2xl border text-center transition-all active:scale-95 transition-transform ${
                    form.role === r.id
                      ? "bg-[#39FF14]/10 border-[#39FF14] text-[#39FF14]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <div className="text-xl">{r.icon}</div>
                  <div className="text-xs mt-1 font-display font-bold tracking-wide">{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm animate-slide-in">
                {error}
              </div>
            )}

            <div className="space-y-1 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <label className="text-gray-400 text-xs uppercase tracking-widest font-display">Nombre completo</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-neon"
                placeholder="Tu nombre completo"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <label className="text-gray-400 text-xs uppercase tracking-widest font-display">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-neon"
                placeholder="+52 55 1234 5678"
                autoComplete="tel"
              />
            </div>

            <div className="space-y-1 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <label className="text-gray-400 text-xs uppercase tracking-widest font-display">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-neon"
                placeholder="tu@email.com"
                autoComplete="email"
              />
              <p className="text-gray-600 text-xs mt-1">Necesitas al menos teléfono o email</p>
            </div>

            <div className="space-y-1 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <label className="text-gray-400 text-xs uppercase tracking-widest font-display">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setPwStrength(calcStrength(e.target.value));
                }}
                className="input-neon"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < pwStrength ? strengthColors[pwStrength] : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-display tracking-widest">
                    {strengthLabels[pwStrength]}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <label className="text-gray-400 text-xs uppercase tracking-widest font-display">Confirmar contraseña</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={`input-neon ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? "border-red-500/60 focus:border-red-500"
                    : form.confirmPassword && form.password === form.confirmPassword
                    ? "border-[#39FF14]/60 focus:border-[#39FF14]"
                    : ""
                }`}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
              <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-2xl mt-2 active:scale-95 transition-transform">
                {loading ? "CREANDO CUENTA..." : "CREAR CUENTA"}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs uppercase tracking-widest font-display">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="space-y-3">
            {process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== "false" && (
              <button
                onClick={() => signIn("google", { callbackUrl: "/auth/oauth-callback" })}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>
            )}
            <button
              onClick={() => signIn("apple", { callbackUrl: "/auth/oauth-callback" })}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continuar con Apple
            </button>
          </div>

          <p className="text-center text-sm mt-6 text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <button onClick={() => router.push("/auth/login")} className="text-[#39FF14] hover:opacity-80 font-semibold transition-opacity">
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
