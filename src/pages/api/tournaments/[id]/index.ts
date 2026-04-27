// GET /api/tournaments/[id] — Tournament detail
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query as { id: string };

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, logo: true } },
        _count: { select: { teams: true } },
      },
    });
    if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });

    const matches = await prisma.bracketMatch.findMany({
      where: { round: { tournamentId: id } },
      include: {
        homeTeam: { select: { id: true, name: true, colorHex: true, logo: true } },
        awayTeam: { select: { id: true, name: true, colorHex: true, logo: true } },
        round: { select: { id: true, roundNum: true, bracketType: true } },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });

    return res.json({ tournament, matches });
  } catch (err) {
    console.error("Tournament detail error:", err);
    return res.status(500).json({ error: "Error al cargar torneo" });
  }
}
