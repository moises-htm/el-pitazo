import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query as { id: string };
  try {
    const rounds = await prisma.bracketRound.findMany({
      where: { tournamentId: id },
      orderBy: { roundNum: "asc" },
      include: {
        matches: {
          include: {
            homeTeam: { select: { name: true, colorHex: true } },
            awayTeam: { select: { name: true, colorHex: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return res.json({ rounds });
  } catch { return res.status(500).json({ error: "No se pudo obtener el bracket" }); }
}
