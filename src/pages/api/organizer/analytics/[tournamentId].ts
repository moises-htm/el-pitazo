import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const tournamentId = req.query.tournamentId as string;
  if (!tournamentId) return res.status(400).json({ error: "Missing tournamentId" });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, creatorId: true, name: true },
  });
  if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });
  if (tournament.creatorId !== userId) return res.status(403).json({ error: "Acceso denegado" });

  const [
    teams,
    allMatches,
    matchEvents,
    feedPosts,
    chatRooms,
  ] = await Promise.all([
    prisma.team.findMany({
      where: { tournamentId },
      select: {
        id: true,
        name: true,
        payStatus: true,
        playersCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bracketMatch.findMany({
      where: { round: { tournamentId } },
      select: { id: true, status: true, homeScore: true, awayScore: true },
    }),
    prisma.matchEvent.findMany({
      where: { eventType: "GOAL", match: { round: { tournamentId } } },
      select: {
        playerId: true,
        teamId: true,
        player: { select: { name: true } },
      },
    }),
    prisma.feedPost.count({ where: { tournamentId } }),
    prisma.chatRoom.findMany({
      where: { tournamentId },
      select: { _count: { select: { messages: true } } },
    }),
  ]);

  // Registration timeline: teams per day
  const byDay: Record<string, number> = {};
  for (const t of teams) {
    const day = t.createdAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const registrationTimeline = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Payment breakdown
  const paymentBreakdown = {
    PAID: teams.filter((t) => t.payStatus === "PAID").length,
    PARTIAL: teams.filter((t) => t.payStatus === "PARTIAL").length,
    PENDING: teams.filter((t) => t.payStatus === "PENDING").length,
    REFUNDED: teams.filter((t) => t.payStatus === "REFUNDED").length,
  };
  const payRate =
    teams.length > 0
      ? Math.round((paymentBreakdown.PAID / teams.length) * 100)
      : 0;

  // Match completion
  const totalMatches = allMatches.length;
  const completedMatches = allMatches.filter((m) => m.status === "COMPLETED").length;
  const matchRate =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  // Total goals scored
  const totalGoals = matchEvents.length;

  // Build team name lookup from the teams array
  const teamNameById: Record<string, string> = {};
  for (const t of teams) teamNameById[t.id] = t.name;

  // Goals per team for bar chart
  const goalsByTeam: Record<string, { name: string; goals: number }> = {};
  for (const ev of matchEvents) {
    if (!ev.teamId) continue;
    const teamName = teamNameById[ev.teamId];
    if (!teamName) continue;
    if (!goalsByTeam[ev.teamId]) goalsByTeam[ev.teamId] = { name: teamName, goals: 0 };
    goalsByTeam[ev.teamId].goals += 1;
  }
  const goalsPerTeam = Object.values(goalsByTeam).sort((a, b) => b.goals - a.goals);

  // Top scorers
  const scorerMap: Record<string, { name: string; goals: number }> = {};
  for (const ev of matchEvents) {
    if (!ev.playerId || !ev.player) continue;
    if (!scorerMap[ev.playerId]) scorerMap[ev.playerId] = { name: ev.player.name, goals: 0 };
    scorerMap[ev.playerId].goals += 1;
  }
  const topScorers = Object.entries(scorerMap)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

  // Chat messages total
  const totalMessages = chatRooms.reduce((sum, r) => sum + r._count.messages, 0);

  // Summary stats
  const totalPlayers = teams.reduce((sum, t) => sum + t.playersCount, 0);
  const avgGoalsPerMatch =
    completedMatches > 0 ? (totalGoals / completedMatches).toFixed(2) : "0";

  return res.json({
    summary: {
      totalTeams: teams.length,
      totalPlayers,
      totalMatches,
      completedMatches,
      matchRate,
      totalGoals,
      avgGoalsPerMatch: parseFloat(avgGoalsPerMatch),
      payRate,
      feedPosts,
      chatMessages: totalMessages,
    },
    registrationTimeline,
    paymentBreakdown,
    goalsPerTeam,
    topScorers,
  });
}
