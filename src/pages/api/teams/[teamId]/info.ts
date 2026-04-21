import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const teamId = req.query.teamId as string;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      colorHex: true,
      playersCount: true,
      tournament: { select: { name: true, status: true } },
    },
  });
  if (!team) return res.status(404).json({ error: "Equipo no encontrado" });
  return res.json({ team });
}
