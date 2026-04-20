import { useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "../stores/auth";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password) return setError("Necesitas contraseña");
    if (!form.phone && !form.email) return setError("Necesitas teléfono o email");

    setLoading(true);
    setError("");
    try {
      await login(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white mb-6 flex items-center gap-1">
          <ArrowLeft size={18} /> Volver
        </button>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Iniciar Sesión</h1>
          <p className="text-blue-300">Bienvenido de vuelta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="text-gray-300 text-sm block mb-1">Teléfono o Email</label>
            <input
              type="text"
              value={form.phone || form.email}
              onChange={(e) => setForm({ ...form, phone: e.target.value, email: "" })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="+52 55 1234 5678 o tu@email.com"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-400">¿No tienes cuenta? </span>
            <button type="button" onClick={() => router.push("/auth/register")} className="text-blue-400 hover:text-blue-300 underline">
              Regístrate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
