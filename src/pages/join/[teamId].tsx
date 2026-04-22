import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Trophy, Users, DollarSign, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface TeamInviteInfo {
  team: {
    id: string;
    name: string;
    logo?: string;
    colorHex?: string;
    playersCount: number;
    payAmount: number;
    tournament: {
      id: string;
      name: string;
      type: string;
      regFee: number;
      currency: string;
      status: string;
      startDate?: string;
      maxTeams: number;
    };
    captain?: { id: string; name: string };
  };
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

const typeLabel = (t: string) =>
  t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos" : "Swiss";

export default function JoinTeamPage() {
  const router = useRouter();
  const { teamId } = router.query as { teamId: string };
  const { user, token, hydrated, hydrate } = useAuthStore();

  const [info, setInfo] = useState<TeamInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/teams/${teamId}/invite-info`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setInfo(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [teamId]);

  async function handleJoin() {
    if (!token) {
      router.push(`/auth/register?returnUrl=/join/${teamId}`);
      return;
    }
    setJoining(true);
    try {
      await api(`/api/teams/${teamId}/join`, { method: "POST" });
      setJoined(true);
      toast.success("¡Te uniste al equipo!");
    } catch (e: any) {
      toast.error(e.message || "No se pudo unir al equipo");
    } finally {
      setJoining(false);
    }
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <CheckCircle size={64} className="mx-auto text-[#39FF14] mb-4" style={{ filter: "drop-shadow(0 0 16px rgba(57,255,20,0.5))" }} />
          <h2 className="font-display font-black text-3xl uppercase text-white mb-2">¡Bienvenido!</h2>
          <p className="text-gray-400 mb-6">Ya eres parte del equipo {info?.team.name}.</p>
          <button
            onClick={() => router.push("/dashboard/player")}
            className="w-full bg-[#39FF14] hover:bg-[#4fff2a] text-black font-display font-black uppercase py-3 rounded-xl transition-all"
            style={{ boxShadow: "0 0 20px rgba(57,255,20,0.4)" }}
          >
            Ver mi panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* Logo/brand */}
        <div className="text-center mb-8">
          <span className="font-display font-black text-2xl text-[#39FF14] uppercase tracking-widest">
            El Pitazo
          </span>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <p className="text-red-400 font-display uppercase">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24" />
            <Skeleton className="h-12" />
          </div>
        ) : info ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Color banner */}
            {info.team.colorHex && (
              <div className="h-2" style={{ backgroundColor: info.team.colorHex }} />
            )}

            <div className="p-6 space-y-5">
              {/* Team name */}
              <div className="text-center">
                {info.team.logo ? (
                  <img
                    src={info.team.logo}
                    alt={info.team.name}
                    className="w-16 h-16 rounded-xl mx-auto mb-3 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl mx-auto mb-3 bg-gray-800 flex items-center justify-center text-2xl">
                    ⚽
                  </div>
                )}
                <h1 className="font-display font-black text-3xl uppercase text-white">
                  {info.team.name}
                </h1>
                <p className="text-gray-400 text-sm mt-1">Te han invitado a este equipo</p>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="text-gray-500 text-xs font-display uppercase tracking-wide">Torneo</span>
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{info.team.tournament.name}</p>
                  <p className="text-gray-500 text-xs">{typeLabel(info.team.tournament.type)}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-blue-400" />
                    <span className="text-gray-500 text-xs font-display uppercase tracking-wide">Capitán</span>
                  </div>
                  <p className="text-white text-sm font-semibold truncate">
                    {info.team.captain?.name ?? "—"}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-[#39FF14]" />
                    <span className="text-gray-500 text-xs font-display uppercase tracking-wide">Jugadores</span>
                  </div>
                  <p className="text-white text-sm font-semibold">{info.team.playersCount}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-green-400" />
                    <span className="text-gray-500 text-xs font-display uppercase tracking-wide">Cuota</span>
                  </div>
                  <p className="text-white text-sm font-semibold">
                    {Number(info.team.tournament.regFee).toLocaleString("es-MX")} {info.team.tournament.currency}
                  </p>
                </div>
              </div>

              {info.team.tournament.startDate && (
                <p className="text-gray-500 text-sm text-center">
                  Inicio:{" "}
                  <span className="text-gray-300">
                    {new Date(info.team.tournament.startDate).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              )}

              {/* CTA */}
              {token ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-[#39FF14] hover:bg-[#4fff2a] disabled:opacity-50 text-black font-display font-black uppercase py-4 rounded-xl transition-all text-lg"
                  style={{ boxShadow: "0 0 20px rgba(57,255,20,0.35)" }}
                >
                  {joining ? "Uniéndome..." : "Unirme al Equipo"}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/auth/register?returnUrl=/join/${teamId}`)}
                    className="w-full bg-[#39FF14] hover:bg-[#4fff2a] text-black font-display font-black uppercase py-4 rounded-xl transition-all text-lg"
                    style={{ boxShadow: "0 0 20px rgba(57,255,20,0.35)" }}
                  >
                    Crear Cuenta y Unirme
                  </button>
                  <button
                    onClick={() => router.push(`/auth/login?returnUrl=/join/${teamId}`)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-display uppercase py-3 rounded-xl transition-all"
                  >
                    Ya tengo cuenta
                  </button>
                </div>
              )}

              <p className="text-gray-600 text-xs text-center">
                Al unirte aceptas las reglas del torneo
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
