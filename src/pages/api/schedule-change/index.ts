import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    const { matchId, proposedTime, reason } = req.body as { matchId: string; proposedTime: string; reason?: string };
    if (!matchId || !proposedTime) return res.status(400).json({ error: "matchId y proposedTime requeridos" });

    // Verify caller is a captain of one of the teams in this match
    const match = await prisma.bracketMatch.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { include: { members: { where: { userId, isCaptain: true } } } },
        awayTeam: { include: { members: { where: { userId, isCaptain: true } } } },
      },
    });
    if (!match) return res.status(404).json({ error: "Partido no encontrado" });

    const isCaptain = (match.homeTeam?.members?.length ?? 0) > 0 || (match.awayTeam?.members?.length ?? 0) > 0;
    if (!isCaptain) return res.status(403).json({ error: "Solo capitanes pueden proponer cambios" });

    const request = await prisma.scheduleChangeRequest.create({
      data: { matchId, requestedById: userId, proposedTime: new Date(proposedTime), reason },
    });
    return res.json({ request });
  }

  if (req.method === "GET") {
    const { matchId } = req.query;
    if (!matchId) return res.status(400).json({ error: "matchId requerido" });
    const requests = await prisma.scheduleChangeRequest.findMany({
      where: { matchId: matchId as string },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ requests });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
