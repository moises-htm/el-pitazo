import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query as { id: string };

  try {
    const matches = await prisma.bracketMatch.findMany({
      where: { round: { tournamentId: id } },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true, colorHex: true } },
        awayTeam: { select: { id: true, name: true, logo: true, colorHex: true } },
        field: { select: { name: true, address: true } },
        round: { select: { roundNum: true } },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });
    return res.json({ matches });
  } catch {
    return res.status(500).json({ error: "Error al obtener calendario" });
  }
}
