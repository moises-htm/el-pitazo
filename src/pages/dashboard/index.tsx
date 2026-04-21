// Main layout with conditional routing based on user role
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { useRouter } from "next/router";
import { Loader2, LogOut, ChevronDown } from "lucide-react";
import OrganizerDashboard from "./organizer";
import PlayerDashboard from "./player";
import RefereeDashboard from "./referee";
import Link from "next/link";

const ACTIVE_ROLE_KEY = "active-role";

export default function Dashboard() {
  const { user, token, logout, hydrated } = useAuthStore();
  const router = useRouter();
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Redirect only after hydration — otherwise persisted logins get kicked out
  useEffect(() => {
    if (hydrated && !token) router.push("/");
  }, [hydrated, token, router]);

  // Resolve active role from storage (falls back to first role)
  useEffect(() => {
    if (!user?.role?.length) return;
    const stored = storage.get(ACTIVE_ROLE_KEY);
    const resolved = stored && user.role.includes(stored) ? stored : user.role[0];
    setActiveRole(resolved);
  }, [user]);

  // Close picker on outside click (touch-friendly for mobile)
  useEffect(() => {
    if (!showRolePicker) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowRolePicker(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [showRolePicker]);

  if (!hydrated || !token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const switchToRole = (role: string) => {
    storage.set(ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
    setShowRolePicker(false);
  };

  const roleLabel = (r: string | null) =>
    r === "PLAYER" ? "Jugador" : r === "REFEREE" ? "Árbitro" : "Organizador";
  const roleIcon = (r: string | null) =>
    r === "PLAYER" ? "⚽" : r === "REFEREE" ? "🟨" : "👔";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {/* Top bar — `relative z-50` hoists this above sub-dashboard stacking contexts */}
      <div className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white font-bold text-lg">El Pitazo</Link>
            {user?.role && user.role.length > 1 && (
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowRolePicker((v) => !v)}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  <span className="text-yellow-400">{roleIcon(activeRole)}</span>
                  {roleLabel(activeRole)}
                  <ChevronDown size={14} />
                </button>
                {showRolePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden min-w-[200px]">
                    {user.role.map((role) => (
                      <button
                        key={role}
                        onClick={() => switchToRole(role)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-all ${
                          activeRole === role ? "bg-blue-600/20 text-blue-400" : "text-gray-300"
                        }`}
                      >
                        <span className="text-lg">{roleIcon(role)}</span>
                        {roleLabel(role)}
                        {activeRole === role && <span className="ml-auto text-blue-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden md:block">{user?.name}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="max-w-6xl mx-auto">
        {activeRole === "ORGANIZER" && <OrganizerDashboard />}
        {activeRole === "PLAYER" && <PlayerDashboard />}
        {activeRole === "REFEREE" && <RefereeDashboard />}
      </div>
    </div>
  );
}
