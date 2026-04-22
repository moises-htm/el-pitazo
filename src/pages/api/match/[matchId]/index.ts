import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const { matchId } = req.query as { matchId: string };

  try {
    const match = await prisma.bracketMatch.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
              orderBy: { number: "asc" },
            },
          },
        },
        awayTeam: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
              orderBy: { number: "asc" },
            },
          },
        },
        field: { select: { name: true } },
        refereeAssign: { select: { refereeId: true, status: true } },
        round: { include: { tournament: { select: { id: true, name: true, type: true } } } },
      },
    });

    if (!match) return res.status(404).json({ error: "Partido no encontrado" });

    const userId = getUserId(req);
    const isAssignedReferee = match.refereeAssign?.refereeId === userId;

    return res.json({ match, isAssignedReferee });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo obtener el partido" });
  }
}
