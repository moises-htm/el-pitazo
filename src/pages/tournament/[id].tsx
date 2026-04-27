import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Trophy, Users, Calendar, BarChart3, GitBranch, MapPin, DollarSign, Share2, Download } from "lucide-react";
import { LocationMap } from "@/components/location-map";
import { StandingsTable } from "@/components/standings-table";
import { BracketView } from "@/components/bracket-view";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { BottomNav } from "@/components/bottom-nav";
import { toast } from "sonner";

type Tab = "info" | "teams" | "matches" | "standings" | "bracket";

const TYPE_LABEL: Record<string, string> = {
  KNOCKOUT: "Eliminatoria",
  LEAGUE: "Liga",
  GROUPS: "Grupos + Eliminatoria",
  SWISS: "Swiss",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/8 rounded-2xl ${className}`} />;
}

export default function TournamentDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [active, setActive] = useState<Tab>("info");
  const [data, setData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/tournaments/${id}`).then((r) => r.json()),
      fetch(`/api/tournaments/${id}/teams`).then((r) => r.json()),
    ])
      .then(([detail, teamData]) => {
        if (detail.error) throw new Error(detail.error);
        setData(detail);
        setTeams(teamData.teams || []);
      })
      .catch(() => toast.error("No se pudo cargar el torneo"))
      .finally(() => setLoading(false));
  }, [id]);

  const t = data?.tournament;
  const matches: any[] = data?.matches || [];

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "info", label: "Info", icon: Trophy },
    { id: "teams", label: "Equipos", icon: Users },
    { id: "matches", label: "Partidos", icon: Calendar },
    { id: "standings", label: "Tabla", icon: BarChart3 },
    { id: "bracket", label: "Cuadro", icon: GitBranch },
  ];

  const downloadIcs = () => {
    if (!t || !id) return;
    window.open(`/api/tournaments/${id}/calendar.ics`, "_blank");
  };

  if (!id) return null;

  return (
    <div className="min-h-screen bg-pitch-grid text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-base uppercase tracking-tight truncate">
              {loading ? "Cargando…" : t?.name || "Torneo"}
            </h1>
            {t?.organization?.name && (
              <p className="text-xs text-gray-500 truncate">{t.organization.name}</p>
            )}
          </div>
          {t && (
            <>
              <button
                onClick={downloadIcs}
                title="Calendario .ics"
                className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-emerald-300"
              >
                <Download size={18} />
              </button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t border-white/5 overflow-x-auto">
          <div className="max-w-3xl mx-auto flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`flex-1 min-w-[80px] flex flex-col items-center gap-1 py-2.5 text-[11px] font-display uppercase tracking-wide border-b-2 transition-colors ${
                    isActive ? "border-emerald-400 text-emerald-300" : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading || !t ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            {active === "info" && <InfoTab t={t} matchCount={matches.length} teamCount={teams.length} />}
            {active === "teams" && <TeamsTab teams={teams} />}
            {active === "matches" && <MatchesTab matches={matches} />}
            {active === "standings" && <StandingsTable tournamentId={id} />}
            {active === "bracket" && <BracketView tournamentId={id} />}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function InfoTab({ t, matchCount, teamCount }: { t: any; matchCount: number; teamCount: number }) {
  const shareText = `🏆 ${t.name} en El Pitazo\n${t.fieldLocation ? `📍 ${t.fieldLocation}\n` : ""}https://elpitazo.app/tournament/${t.id}`;
  const hasMap = (t.fieldLat && t.fieldLng) || t.fieldAddress;
  return (
    <div className="space-y-4">
      <div className="card-glass p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-yellow-400" />
          <span className="text-xs text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded font-display uppercase tracking-wide">
            {TYPE_LABEL[t.type] || t.type}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{t.status}</span>
        </div>
        {t.description && <p className="text-gray-300 text-sm mb-3">{t.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Equipos" value={`${teamCount} / ${t.maxTeams}`} />
          <Stat label="Partidos" value={String(matchCount)} />
          <Stat label="Inscripción" value={`${Number(t.regFee).toLocaleString("es-MX")} ${t.currency}`} />
          {t.startDate && <Stat label="Inicio" value={new Date(t.startDate).toLocaleDateString("es-MX")} />}
        </div>
      </div>

      {hasMap && (
        <div className="card-glass p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wide font-display mb-3">Ubicación</h3>
          <LocationMap lat={t.fieldLat} lng={t.fieldLng} address={t.fieldAddress} name={t.fieldLocation} />
        </div>
      )}

      <div className="card-glass p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-white text-sm font-semibold">Compartir torneo</p>
          <p className="text-gray-500 text-xs">Invita a otros equipos</p>
        </div>
        <WhatsAppShareButton text={shareText} label="WhatsApp" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-3 py-2">
      <p className="text-gray-500 text-xs uppercase tracking-wide font-display">{label}</p>
      <p className="text-white font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function TeamsTab({ teams }: { teams: any[] }) {
  if (teams.length === 0) {
    return (
      <div className="card-glass p-8 text-center">
        <Users size={36} className="mx-auto text-gray-500 mb-3" />
        <p className="text-gray-400 text-sm">Aún no hay equipos inscritos</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {teams.map((team) => (
        <div key={team.id} className="card-glass p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ backgroundColor: (team.colorHex || "#22c55e") + "33", border: `1.5px solid ${team.colorHex || "#22c55e"}` }}
          >
            {team.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{team.name}</p>
            {team.captain && <p className="text-xs text-gray-500">Capitán: {team.captain.name}</p>}
          </div>
          {team.payStatus === "PAID" ? (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Pagado</span>
          ) : (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Pendiente</span>
          )}
        </div>
      ))}
    </div>
  );
}

function MatchesTab({ matches }: { matches: any[] }) {
  if (matches.length === 0) {
    return (
      <div className="card-glass p-8 text-center">
        <Calendar size={36} className="mx-auto text-gray-500 mb-3" />
        <p className="text-gray-400 text-sm">Aún no hay partidos programados</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {matches.map((m) => {
        const status = m.status as string;
        const live = status === "IN_PROGRESS" || status === "HALF_TIME" || status === "SECOND_HALF";
        return (
          <Link key={m.id} href={`/match/${m.id}`} className="card-glass p-4 block hover:border-emerald-400/30 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-display uppercase tracking-wide text-gray-500">
                {m.round?.bracketType || `Ronda ${m.round?.roundNum ?? "?"}`}
              </span>
              {live && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded animate-pulse">EN VIVO</span>}
              {status === "COMPLETED" && <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">Final</span>}
              {status === "SCHEDULED" && m.scheduledAt && (
                <span className="text-xs text-gray-400">{new Date(m.scheduledAt).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white truncate flex-1 text-right">{m.homeTeam?.name ?? "TBD"}</span>
              <span className="font-display font-black text-lg tabular-nums">
                {m.homeScore ?? "-"} : {m.awayScore ?? "-"}
              </span>
              <span className="font-semibold text-white truncate flex-1">{m.awayTeam?.name ?? "TBD"}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
