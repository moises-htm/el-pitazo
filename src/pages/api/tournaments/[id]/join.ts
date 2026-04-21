// POST /api/tournaments/[id]/join
// Creates a new Team in the tournament with the caller as captain
// and a TeamMember row marking them jersey #1. This is the
// "Inscribirse" flow from the Player dashboard.
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { Prisma, TournamentStatus } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const tournamentId = req.query.id as string;
  const { teamName, colorHex, skillLevel } = (req.body || {}) as {
    teamName?: string;
    colorHex?: string;
    skillLevel?: number;
  };

  if (!teamName || teamName.trim().length < 2) {
    return res.status(400).json({ error: "Nombre de equipo requerido" });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { teams: true } } },
  });
  if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });
  if (tournament.status !== TournamentStatus.ACTIVE) {
    return res.status(400).json({ error: "El torneo no está activo" });
  }
  if (tournament._count.teams >= tournament.maxTeams) {
    return res.status(400).json({ error: "Torneo lleno" });
  }

  // Team.captainId is @unique globally — a user can only captain one team at a time.
  const existingCaptain = await prisma.team.findUnique({ where: { captainId: userId } });
  if (existingCaptain) {
    return res.status(400).json({ error: "Ya eres capitán de otro equipo" });
  }

  try {
    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          tournamentId,
          name: teamName.trim(),
          captainId: userId,
          colorHex: colorHex ?? null,
          skillLevel: skillLevel ?? null,
          payAmount: tournament.regFee,
          playersCount: 1,
        },
      });
      await tx.teamMember.create({
        data: { teamId: created.id, userId, number: 1, isCaptain: true },
      });
      return created;
    });
    return res.status(201).json({ team });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un equipo con ese nombre en este torneo" });
    }
    return res.status(500).json({ error: err?.message || "Error inesperado" });
  }
}
