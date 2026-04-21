import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Users, Trophy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function JoinTeamPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const teamId = router.query.id as string;
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/teams/${teamId}/info`)
      .then(r => r.json())
      .then(d => setTeam(d.team))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamId]);

  async function join() {
    if (!token) {
      router.push(`/auth/register?redirect=/join/team?id=${teamId}`);
      return;
    }
    setJoining(true);
    try {
      await api(`/api/teams/${teamId}/join`, { method: "POST", auth: true });
      setJoined(true);
      toast.success("¡Te uniste al equipo!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
      toast.error(e.message || "Error al unirte");
    } finally {
      setJoining(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 flex items-center justify-center">
      <div className="animate-pulse text-white">Cargando...</div>
    </div>
  );

  if (!team) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-white text-xl font-bold mb-2">Equipo no encontrado</h2>
        <p className="text-gray-400">El enlace puede haber expirado o ser inválido.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
        {/* Team color badge */}
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          style={{ backgroundColor: team.colorHex || "#16a34a" }}>
          ⚽
        </div>
        <h2 className="text-white text-2xl font-bold mb-1">{team.name}</h2>
        <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mb-1">
          <Trophy size={14} />
          <span>{team.tournament?.name}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mb-6">
          <Users size={14} />
          <span>{team.playersCount} jugadores</span>
        </div>

        {joined ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle size={40} className="text-green-400" />
            <p className="text-white font-semibold">¡Bienvenido al equipo!</p>
            <p className="text-gray-400 text-sm">Redirigiendo a tu panel...</p>
          </div>
        ) : (
          <>
            <button
              onClick={join}
              disabled={joining}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-lg transition-all mb-3">
              {joining ? "Uniéndose..." : "Unirme al equipo"}
            </button>
            {!token && (
              <p className="text-gray-400 text-xs">Se te pedirá iniciar sesión o registrarte para unirte.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
