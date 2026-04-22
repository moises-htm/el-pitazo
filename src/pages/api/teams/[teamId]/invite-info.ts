import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const teamId = req.query.teamId as string;
  if (!teamId) return res.status(400).json({ error: "Missing teamId" });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      logo: true,
      colorHex: true,
      playersCount: true,
      payAmount: true,
      tournament: {
        select: {
          id: true,
          name: true,
          type: true,
          regFee: true,
          currency: true,
          status: true,
          startDate: true,
          maxTeams: true,
        },
      },
      captain: { select: { id: true, name: true } },
    },
  });

  if (!team) return res.status(404).json({ error: "Equipo no encontrado" });

  return res.json({ team });
}
