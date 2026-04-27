import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  earned: boolean;
  threshold?: number;
  progress?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const events = await prisma.matchEvent.groupBy({
      by: ["eventType"],
      where: { playerId: userId },
      _count: { eventType: true },
    });
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.eventType] = e._count.eventType;

    const matchCount = await prisma.matchEvent.findMany({
      where: { playerId: userId },
      select: { matchId: true },
      distinct: ["matchId"],
    });
    const matches = matchCount.length;

    const goals = counts["GOL"] || counts["GOAL"] || 0;
    const yellow = counts["TARJETA_AMARILLA"] || counts["YELLOW_CARD"] || 0;
    const red = counts["TARJETA_ROJA"] || counts["RED_CARD"] || 0;
    const assists = counts["ASISTENCIA"] || counts["ASSIST"] || 0;

    const tournaments = await prisma.teamMember.count({ where: { userId } });

    const badges: Badge[] = [
      {
        id: "first_match",
        label: "Debutante",
        emoji: "🎉",
        description: "Tu primer partido jugado",
        earned: matches >= 1, threshold: 1, progress: matches,
      },
      {
        id: "first_goal",
        label: "Primer gol",
        emoji: "⚽",
        description: "Anota tu primer gol",
        earned: goals >= 1, threshold: 1, progress: goals,
      },
      {
        id: "scorer",
        label: "Goleador",
        emoji: "🎯",
        description: "10 goles totales",
        earned: goals >= 10, threshold: 10, progress: goals,
      },
      {
        id: "top_scorer",
        label: "Pichichi",
        emoji: "👑",
        description: "25 goles totales",
        earned: goals >= 25, threshold: 25, progress: goals,
      },
      {
        id: "playmaker",
        label: "Asistidor",
        emoji: "🅰️",
        description: "10 asistencias",
        earned: assists >= 10, threshold: 10, progress: assists,
      },
      {
        id: "veteran",
        label: "Veterano",
        emoji: "🛡️",
        description: "20 partidos jugados",
        earned: matches >= 20, threshold: 20, progress: matches,
      },
      {
        id: "clean",
        label: "Caballero",
        emoji: "🤝",
        description: "10 partidos sin tarjetas",
        earned: matches >= 10 && yellow === 0 && red === 0,
      },
      {
        id: "tournament_collector",
        label: "Coleccionista",
        emoji: "🏆",
        description: "5 torneos jugados",
        earned: tournaments >= 5, threshold: 5, progress: tournaments,
      },
    ];

    return res.json({ badges, stats: { matches, goals, assists, yellow, red, tournaments } });
  } catch {
    return res.status(500).json({ error: "Error al obtener badges" });
  }
}
