import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });
  const { teamId } = req.query as { teamId: string };

  try {
    const [member, team] = await Promise.all([
      prisma.teamMember.findFirst({ where: { teamId, userId } }),
      prisma.team.findUnique({ where: { id: teamId }, select: { captainId: true } }),
    ]);

    if (!member && team?.captainId !== userId) {
      return res.status(403).json({ error: "Sin acceso a este equipo" });
    }

    const payments = await prisma.payment.findMany({
      where: { teamId },
      include: { tournament: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ payments });
  } catch {
    return res.status(500).json({ error: "Error al obtener pagos del equipo" });
  }
}
