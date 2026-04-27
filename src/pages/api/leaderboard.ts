import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const period = (req.query.period as string) || "weekly";
  const tournamentId = req.query.tournamentId as string | undefined;
  const eventType = (req.query.eventType as string) || "GOL";

  const since = new Date();
  if (period === "weekly") since.setDate(since.getDate() - 7);
  else if (period === "monthly") since.setMonth(since.getMonth() - 1);
  else if (period === "season") since.setFullYear(since.getFullYear() - 1);
  else since.setFullYear(2000); // all-time

  try {
    const events = await prisma.matchEvent.findMany({
      where: {
        eventType,
        createdAt: { gte: since },
        playerId: { not: null },
        ...(tournamentId ? { match: { round: { tournamentId } } } : {}),
      },
      select: {
        playerId: true,
        player: { select: { id: true, name: true, avatar: true } },
      },
    });

    const counts = new Map<string, { id: string; name: string; avatar?: string | null; total: number }>();
    for (const ev of events) {
      if (!ev.playerId || !ev.player) continue;
      const existing = counts.get(ev.playerId);
      if (existing) existing.total++;
      else counts.set(ev.playerId, { id: ev.player.id, name: ev.player.name, avatar: ev.player.avatar, total: 1 });
    }

    const leaderboard = Array.from(counts.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    return res.json({ leaderboard, period, eventType });
  } catch {
    return res.status(500).json({ error: "Error al calcular leaderboard" });
  }
}
