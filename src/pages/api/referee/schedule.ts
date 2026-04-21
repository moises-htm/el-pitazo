import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignments = await prisma.refereeAssignment.findMany({
      where: {
        refereeId: userId,
        match: { scheduledAt: { gte: today, lt: tomorrow } },
      },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true, colorHex: true } },
            awayTeam: { select: { name: true, colorHex: true } },
            field: { select: { name: true } },
            round: { include: { tournament: { select: { name: true } } } },
          },
        },
      },
      orderBy: { match: { scheduledAt: "asc" } },
    });

    const matches = assignments.map((a) => ({
      id: a.matchId,
      time: a.match.scheduledAt?.toISOString() || null,
      field: a.match.field?.name || "Campo por definir",
      home: a.match.homeTeam?.name || "Por definir",
      away: a.match.awayTeam?.name || "Por definir",
      tournament: a.match.round.tournament.name,
      status: a.match.status.toLowerCase(),
      assignmentStatus: a.status,
    }));

    return res.json({ matches });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo obtener el horario" });
  }
}
