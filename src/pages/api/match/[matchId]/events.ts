import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { matchId } = req.query as { matchId: string };

  if (req.method === "GET") {
    try {
      const events = await prisma.matchEvent.findMany({
        where: { matchId },
        include: {
          player: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [{ minute: "asc" }, { extraMin: "asc" }, { createdAt: "asc" }],
      });
      return res.json({ events });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudo obtener los eventos" });
    }
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const assignment = await prisma.refereeAssignment.findFirst({
      where: { matchId, refereeId: userId },
    });
    if (!assignment) return res.status(403).json({ error: "Solo el árbitro asignado puede registrar eventos" });

    const match = await prisma.bracketMatch.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Partido no encontrado" });
    if (match.status === "COMPLETED") return res.status(400).json({ error: "El partido ya finalizó" });
    if (match.status === "SCHEDULED") return res.status(400).json({ error: "El partido aún no ha comenzado" });

    const { teamId, playerId, eventType, minute, extraMin, details } = req.body;
    if (!eventType || minute === undefined) {
      return res.status(400).json({ error: "Faltan campos requeridos: eventType y minute" });
    }

    try {
      const event = await prisma.matchEvent.create({
        data: {
          matchId,
          teamId: teamId || null,
          playerId: playerId || null,
          eventType,
          minute: Number(minute),
          extraMin: Number(extraMin || 0),
          details: details || null,
        },
        include: {
          player: { select: { id: true, name: true, avatar: true } },
        },
      });

      if (eventType === "GOL" && teamId) {
        const isHome = match.homeTeamId === teamId;
        await prisma.bracketMatch.update({
          where: { id: matchId },
          data: isHome
            ? { homeScore: { increment: 1 } }
            : { awayScore: { increment: 1 } },
        });
      }

      return res.status(201).json({ event });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudo registrar el evento" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
