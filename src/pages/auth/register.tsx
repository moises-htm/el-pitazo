import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

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
      </div>
    </div>
  );
}
