// GET /api/tournaments/[id]/leaderboard — top scorers + assists
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query as { id: string };

  try {
    const events = await prisma.matchEvent.findMany({
      where: {
        eventType: { in: ["GOL", "ASISTENCIA"] },
        match: { round: { tournamentId: id } },
      },
      include: {
        player: { select: { id: true, name: true, avatar: true } },
      },
    });

    const teamIds = Array.from(new Set(events.map((e) => e.teamId).filter(Boolean) as string[]));
    const teams = teamIds.length
      ? await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true, colorHex: true },
        })
      : [];
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const byPlayer = new Map<string, { player: any; team: any; goals: number; assists: number }>();
    for (const ev of events) {
      if (!ev.playerId || !ev.player) continue;
      const k = ev.playerId;
      const team = ev.teamId ? teamMap.get(ev.teamId) : null;
      const e = byPlayer.get(k) ?? { player: ev.player, team, goals: 0, assists: 0 };
      if (ev.eventType === "GOL") e.goals += 1;
      else if (ev.eventType === "ASISTENCIA") e.assists += 1;
      byPlayer.set(k, e);
    }

    const all = Array.from(byPlayer.values());
    const scorers = [...all].sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, 10);
    const assistants = [...all].sort((a, b) => b.assists - a.assists || b.goals - a.goals).slice(0, 10);

    return res.json({ scorers, assistants });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Error al cargar el leaderboard" });
  }
}
