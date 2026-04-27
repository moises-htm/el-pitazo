import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

/**
 * Computes attendance streak: number of recent COMPLETED matches in a row
 * where the player was on the lineup (had any match event).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Get all completed matches the player's teams played, most recent first
    const memberships = await prisma.teamMember.findMany({
      where: { userId }, select: { teamId: true },
    });
    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) return res.json({ streak: 0, total: 0 });

    const matches = await prisma.bracketMatch.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
      },
      orderBy: { finishedAt: "desc" },
      take: 30,
      select: { id: true },
    });

    const matchIds = matches.map((m) => m.id);
    if (matchIds.length === 0) return res.json({ streak: 0, total: 0 });

    const events = await prisma.matchEvent.findMany({
      where: { playerId: userId, matchId: { in: matchIds } },
      select: { matchId: true },
    });
    const present = new Set(events.map((e) => e.matchId));

    let streak = 0;
    for (const m of matches) {
      if (present.has(m.id)) streak++;
      else break;
    }
    return res.json({ streak, total: present.size });
  } catch {
    return res.status(500).json({ error: "Error al calcular racha" });
  }
}
