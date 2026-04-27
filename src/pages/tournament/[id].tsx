import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Trophy, Calendar, ListOrdered, Wallet, Users, Share2, Download, Loader2 } from "lucide-react";
import { StandingsTable } from "@/components/standings-table";
import { BracketView } from "@/components/bracket-view";
import { FinancialDashboard } from "@/components/financial-dashboard";
import { useI18n } from "@/lib/i18n";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  type: string;
  maxTeams: number;
  status: string;
  startDate?: string;
  endDate?: string;
  fieldLocation?: string;
  fieldAddress?: string;
  regFee: string | number;
  currency: string;
  coverImage?: string;
  creator?: { id: string; name: string; avatar?: string };
  _count?: { teams: number };
}

interface Team {
  id: string;
  name: string;
  logo?: string;
  colorHex?: string;
  payStatus: string;
  playersCount: number;
  captain?: { name: string } | null;
}

interface Match {
  id: string;
  homeTeam?: { id: string; name: string; colorHex?: string } | null;
  awayTeam?: { id: string; name: string; colorHex?: string } | null;
  homeScore?: number | null;
  awayScore?: number | null;
  scheduledAt?: string | null;
  status: string;
  field?: { name: string; address?: string } | null;
  round?: { roundNum: number };
}

const TABS = [
  { id: "teams", icon: Users, key: "tournament.tabs.teams" },
  { id: "calendar", icon: Calendar, key: "tournament.tabs.calendar" },
  { id: "scores", icon: Trophy, key: "tournament.tabs.scores" },
  { id: "standings", icon: ListOrdered, key: "tournament.tabs.standings" },
  { id: "finance", icon: Wallet, key: "tournament.tabs.finance" },
] as const;

export default function TournamentPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { t } = useI18n();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("teams");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchTournament();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (tab === "teams") fetchTeams();
    if (tab === "calendar" || tab === "scores") fetchMatches();
  }, [id, tab]);

  async function fetchTournament() {
    setLoading(true);
    try {
      const data = await api<{ tournament: Tournament }>(`/api/tournaments/${id}`, { auth: false });
      setTournament(data.tournament);
    } catch {
      // ignore — show empty state
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams() {
    try {
      const data = await api<{ teams: Team[] }>(`/api/tournaments/${id}/teams`, { auth: false });
      setTeams(data.teams || []);
    } catch {
      setTeams([]);
    }
  }

  async function fetchMatches() {
    try {
      const data = await api<{ matches: Match[] }>(`/api/tournaments/${id}/calendar`, { auth: false });
      setMatches(data.matches || []);
    } catch {
      setMatches([]);
    }
  }

  function shareLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: tournament?.name, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  }

  function downloadIcs() {
    window.location.href = `/api/tournaments/${id}/ics`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="animate-spin text-green-400" size={32} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6 text-center">
        <Trophy size={48} className="text-gray-600 mb-3" />
        <p className="text-gray-400 mb-4">Torneo no encontrado</p>
        <Link href="/dashboard" className="btn-neon px-4 py-2 text-sm">{t("common.back")}</Link>
      </div>
    );
  }

  const upcomingMatches = matches.filter((m) => m.status === "SCHEDULED");
  const playedMatches = matches.filter((m) => m.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {/* Header */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-3">
            <ArrowLeft size={16} /> {t("common.back")}
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-display uppercase tracking-wide">{tournament.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-display uppercase ${tournament.status === "ACTIVE" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                  {tournament.status}
                </span>
              </div>
              <h1 className="font-display font-black text-2xl uppercase text-white">{tournament.name}</h1>
              {tournament.description && <p className="text-gray-400 text-sm mt-1">{tournament.description}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={shareLink} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/40 text-gray-400 hover:text-green-400">
                <Share2 size={18} />
              </button>
              <button onClick={downloadIcs} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/40 text-gray-400 hover:text-green-400" title=".ics">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto">
            {TABS.map((tabDef) => {
              const Icon = tabDef.icon;
              const active = tab === tabDef.id;
              return (
                <button
                  key={tabDef.id}
                  onClick={() => setTab(tabDef.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display uppercase tracking-wide transition-all flex-1 justify-center min-w-fit ${
                    active ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{t(tabDef.key)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-3">
        {tab === "teams" && (
          <>
            {teams.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-sm">No hay equipos inscritos aún.</p>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="card-glass p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: team.colorHex || "#222", color: "#fff" }}>
                    {team.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-white truncate">{team.name}</p>
                    <p className="text-xs text-gray-500">
                      {team.captain?.name ? `Cap. ${team.captain.name} · ` : ""}
                      {team.playersCount} jugadores
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-display uppercase ${
                    team.payStatus === "PAID" ? "bg-green-500/20 text-green-400" :
                    team.payStatus === "PARTIAL" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {team.payStatus === "PAID" ? "Pagado" : team.payStatus === "PARTIAL" ? "Parcial" : "Pendiente"}
                  </span>
                </div>
              ))
            )}
          </>
        )}

        {tab === "calendar" && (
          <>
            {upcomingMatches.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-sm">No hay partidos programados.</p>
            ) : (
              upcomingMatches.map((m) => (
                <Link key={m.id} href={`/match/${m.id}`} className="card-glass p-4 flex items-center justify-between hover:border-green-500/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-display font-bold truncate">
                      {m.homeTeam?.name || "TBD"} vs {m.awayTeam?.name || "TBD"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "Sin fecha"}
                      {m.field?.name && ` · ${m.field.name}`}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </>
        )}

        {tab === "scores" && (
          <>
            {playedMatches.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-sm">Aún no hay marcadores.</p>
            ) : (
              playedMatches.map((m) => (
                <Link key={m.id} href={`/match/${m.id}`} className="card-glass p-4 flex items-center justify-between hover:border-green-500/30 transition-colors">
                  <span className="text-white font-display truncate">{m.homeTeam?.name}</span>
                  <span className="font-display font-black text-2xl text-green-400 tabular-nums">{m.homeScore} - {m.awayScore}</span>
                  <span className="text-white font-display truncate text-right">{m.awayTeam?.name}</span>
                </Link>
              ))
            )}
            {tournament.type === "KNOCKOUT" && <BracketView tournamentId={id} />}
          </>
        )}

        {tab === "standings" && <StandingsTable tournamentId={id} />}

        {tab === "finance" && <FinancialDashboard tournamentId={id} />}
      </div>
    </div>
  );
}
