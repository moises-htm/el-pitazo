import { api } from "@/lib/api";

interface MatchSummary {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  tournamentId?: string | null;
  tournamentName?: string | null;
}

/**
 * Posts a "match result" entry to the feed. We re-use the videoUrl field
 * with a synthetic placeholder so existing renderers don't blow up; the
 * caption carries the result text. Front-end may filter type later via the
 * caption prefix or a dedicated field if added.
 */
export async function shareMatchResultToFeed(m: MatchSummary, videoUrl?: string) {
  const caption = `${m.homeTeamName} ${m.homeScore} - ${m.awayScore} ${m.awayTeamName}` +
    (m.tournamentName ? ` · ${m.tournamentName}` : "");
  return api("/api/feed", {
    method: "POST",
    body: JSON.stringify({
      videoUrl: videoUrl || `result://${m.matchId}`,
      caption,
      tournamentId: m.tournamentId || null,
    }),
  });
}
