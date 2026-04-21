import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Bell, BellOff, MessageCircle, Calendar, Timer } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/router";

export default function NotificationSettings() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [prefs, setPrefs] = useState({ newMessage: true, scheduleChange: true, matchReminder: true });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/auth/login"); return; }
    api("/api/settings/notifications", { auth: true }).then((d: any) => {
      if (d.prefs) setPrefs(d.prefs);
      setLoading(false);
    });

    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, [user]);

  async function enablePush() {
    if (!("Notification" in window)) { toast.error("Tu navegador no soporta notificaciones"); return; }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { toast.error("Permiso denegado"); return; }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    await api("/api/push/subscribe", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.toJSON().keys }),
      headers: { "Content-Type": "application/json" },
    });

    setPushEnabled(true);
    toast.success("Notificaciones activadas");
  }

  async function savePref(key: string, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await api("/api/settings/notifications", {
      method: "PUT",
      auth: true,
      body: JSON.stringify(updated),
      headers: { "Content-Type": "application/json" },
    });
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 flex items-center justify-center">
      <div className="animate-pulse text-white">Cargando...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-white text-lg font-bold">Notificaciones</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto p-6 space-y-4">
        {/* Push enable card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pushEnabled ? <Bell size={20} className="text-green-400" /> : <BellOff size={20} className="text-gray-400" />}
              <div>
                <p className="text-white font-medium">Notificaciones push</p>
                <p className="text-gray-400 text-sm">{pushEnabled ? "Activadas" : "Desactivadas"}</p>
              </div>
            </div>
            {!pushEnabled && (
              <button onClick={enablePush} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                Activar
              </button>
            )}
          </div>
        </div>

        {/* Preference toggles */}
        {[
          { key: "newMessage", icon: <MessageCircle size={18} />, label: "Nuevos mensajes", desc: "Chat de equipo y liga" },
          { key: "scheduleChange", icon: <Calendar size={18} />, label: "Cambios de horario", desc: "Solicitudes y aprobaciones" },
          { key: "matchReminder", icon: <Timer size={18} />, label: "Recordatorios de partido", desc: "1 hora antes del partido" },
        ].map(({ key, icon, label, desc }) => (
          <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-400">{icon}</span>
              <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
            <button
              onClick={() => savePref(key, !prefs[key as keyof typeof prefs])}
              className={`w-12 h-6 rounded-full transition-all ${prefs[key as keyof typeof prefs] ? "bg-green-600" : "bg-gray-600"}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key as keyof typeof prefs] ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
