// Main layout with conditional routing based on user role
import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "next/router";
import { Loader2, LogOut, ChevronDown } from "lucide-react";
import OrganizerDashboard from "./dashboard/organizer";
import PlayerDashboard from "./dashboard/player";
import RefereeDashboard from "./dashboard/referee";
import Link from "next/link";

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [showRolePicker, setShowRolePicker] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/");
    }
  }, [token, router]);

  if (!token) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  // Determine which role to show
  const activeRole = user?.role && user.role.length > 1 ? null : user?.role?.[0];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const switchToRole = (role) => {
    localStorage.setItem("active-role", role);
    setShowRolePicker(false);
  };

  const getActiveRole = () => {
    const stored = localStorage.getItem("active-role");
    if (stored && user?.role?.includes(stored)) return stored;
    if (user?.role?.[0]) return user.role[0];
    return null;
  };

  const currentRole = getActiveRole();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {/* Top bar */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white font-bold text-lg">El Pitazo</Link>
            {user?.role && user.role.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowRolePicker(!showRolePicker)}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  <span className="text-yellow-400">
                    {currentRole === "PLAYER" ? "⚽" : currentRole === "REFEREE" ? "🟨" : "👔"}
                  </span>
                  {currentRole === "PLAYER" ? "Jugador" : currentRole === "REFEREE" ? "Árbitro" : "Organizador"}
                  <ChevronDown size={14} />
                </button>
                {showRolePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden min-w-[200px]">
                    {user.role.map((role) => (
                      <button
                        key={role}
                        onClick={() => switchToRole(role)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-all ${
                          currentRole === role ? "bg-blue-600/20 text-blue-400" : "text-gray-300"
                        }`}
                      >
                        <span className="text-lg">
                          {role === "PLAYER" ? "⚽" : role === "REFEREE" ? "🟨" : "👔"}
                        </span>
                        {role === "PLAYER" ? "Jugador" : role === "REFEREE" ? "Árbitro" : "Organizador"}
                        {currentRole === role && <span className="ml-auto text-blue-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden md:block">{user.name}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="max-w-6xl mx-auto">
        {currentRole === "ORGANIZER" && <OrganizerDashboard />}
        {currentRole === "PLAYER" && <PlayerDashboard />}
        {currentRole === "REFEREE" && <RefereeDashboard />}
      </div>
    </div>
  );
}
