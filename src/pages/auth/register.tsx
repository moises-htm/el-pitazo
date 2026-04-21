import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
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

    setLoading(true);
    setError("");
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload as any);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["", "Débil", "Regular", "Fuerte"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white mb-6 flex items-center gap-1">
          <ArrowLeft size={18} /> Volver
        </button>

        <div className="mb-6">
          <p className="text-gray-400 text-sm text-center mb-3">¿Cómo vas a usar El Pitazo?</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "PLAYER", label: "Jugador", icon: "⚽" },
              { id: "REFEREE", label: "Árbitro", icon: "🟨" },
              { id: "ORGANIZER", label: "Organizador", icon: "👔" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setForm({ ...form, role: r.id })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.role === r.id
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                }`}
              >
                <div className="text-xl">{r.icon}</div>
                <div className="text-xs mt-1 font-medium">{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${form.name.trim() ? "border-green-500/50 focus:border-green-500" : "border-white/10 focus:border-blue-500"}`}
              placeholder="Tu nombre completo" />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Teléfono o Email *</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                placeholder="+52 55 1234 5678" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                placeholder="tu@email.com" />
            </div>
            <p className="text-gray-500 text-xs mt-1">Necesitas al menos uno</p>
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Contraseña *</label>
            <input type="password" value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setPwStrength(calcStrength(e.target.value)); }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Mínimo 6 caracteres" />
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < pwStrength ? strengthColors[pwStrength] : "bg-white/10"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{strengthLabels[pwStrength]}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Confirmar contraseña *</label>
            <input type="password" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
                form.confirmPassword && form.password !== form.confirmPassword
                  ? "border-red-500/50 focus:border-red-500"
                  : form.confirmPassword && form.password === form.confirmPassword
                  ? "border-green-500/50 focus:border-green-500"
                  : "border-white/10 focus:border-blue-500"
              }`}
              placeholder="Repite la contraseña" />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50">
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-400">¿Ya tienes cuenta? </span>
            <button type="button" onClick={() => router.push("/auth/login")} className="text-blue-400 hover:text-blue-300 underline">
              Iniciar Sesión
            </button>
          </div>
        </form>

        {/* Social login */}
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs uppercase tracking-wider">o continúa con</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="space-y-3">
            {process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== "false" && (
              <button
                onClick={() => signIn("google", { callbackUrl: "/auth/oauth-callback" })}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white py-3 rounded-xl font-medium transition-all"
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
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 py-3 rounded-xl font-medium transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continuar con Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
