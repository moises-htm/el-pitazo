import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

// phase is stored in notes when status=IN_PROGRESS
const VALID_PHASES = ["PRIMER_TIEMPO", "MEDIO_TIEMPO", "SEGUNDO_TIEMPO"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Método no permitido" });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const { matchId } = req.query as { matchId: string };

  const assignment = await prisma.refereeAssignment.findFirst({
    where: { matchId, refereeId: userId },
  });
  if (!assignment) return res.status(403).json({ error: "Solo el árbitro asignado puede cambiar el estado" });

  const match = await prisma.bracketMatch.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: "Partido no encontrado" });
  if (match.status === "COMPLETED") return res.status(400).json({ error: "El partido ya está finalizado" });

  const { action } = req.body as { action: string };

  try {
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "START":
        if (match.status !== "SCHEDULED") return res.status(400).json({ error: "El partido ya inició" });
        updateData = { status: "IN_PROGRESS", notes: "PRIMER_TIEMPO", startedAt: new Date(), homeScore: 0, awayScore: 0 };
        break;
      case "HALF_TIME":
        if (match.status !== "IN_PROGRESS" || match.notes !== "PRIMER_TIEMPO") {
          return res.status(400).json({ error: "Acción no disponible en este momento" });
        }
        updateData = { notes: "MEDIO_TIEMPO" };
        break;
      case "SECOND_HALF":
        if (match.status !== "IN_PROGRESS" || match.notes !== "MEDIO_TIEMPO") {
          return res.status(400).json({ error: "Acción no disponible en este momento" });
        }
        updateData = { notes: "SEGUNDO_TIEMPO" };
        break;
      case "FINISH":
        if (match.status !== "IN_PROGRESS") return res.status(400).json({ error: "El partido no está en curso" });
        updateData = { status: "COMPLETED", notes: "FINALIZADO", finishedAt: new Date() };
        break;
      default:
        return res.status(400).json({ error: "Acción no válida. Usa: START, HALF_TIME, SECOND_HALF, FINISH" });
    }

    const updated = await prisma.bracketMatch.update({
      where: { id: matchId },
      data: updateData,
    });

    if (action === "FINISH") {
      try {
        const enriched = await prisma.bracketMatch.findUnique({
          where: { id: matchId },
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            round: { select: { tournamentId: true, tournament: { select: { name: true } } } },
          },
        });
        if (enriched?.homeTeam && enriched?.awayTeam) {
          const home = enriched.homeTeam.name;
          const away = enriched.awayTeam.name;
          const hs = enriched.homeScore ?? 0;
          const as = enriched.awayScore ?? 0;
          const winner = hs > as ? home : as > hs ? away : null;
          const caption = winner
            ? `🏁 Final · ${home} ${hs} – ${as} ${away} · ¡Ganó ${winner}!`
            : `🏁 Final · ${home} ${hs} – ${as} ${away}`;
          await prisma.feedPost.create({
            data: {
              uploaderId: userId,
              videoUrl: `result:${matchId}`,
              caption,
              tournamentId: enriched.round.tournamentId,
            },
          });
        }
      } catch (e) {
        console.warn("Auto-post failed (non-fatal):", e);
      }
    }

    return res.json({ match: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo actualizar el estado" });
  }
}
