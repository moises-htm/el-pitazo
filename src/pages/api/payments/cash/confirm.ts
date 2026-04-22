import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const { teamId, tournamentId } = req.body;
  if (!teamId || !tournamentId) return res.status(400).json({ error: "teamId y tournamentId son requeridos" });

  try {
    const [tournament, team] = await Promise.all([
      prisma.tournament.findUnique({ where: { id: tournamentId }, select: { creatorId: true, regFee: true } }),
      prisma.team.findUnique({ where: { id: teamId }, select: { id: true, captainId: true, payStatus: true } }),
    ]);

    if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });
    if (tournament.creatorId !== userId) return res.status(403).json({ error: "Solo el organizador puede confirmar pagos en efectivo" });
    if (!team) return res.status(404).json({ error: "Equipo no encontrado" });
    if (team.payStatus === "PAID") return res.status(400).json({ error: "Este equipo ya tiene su pago registrado" });

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tournamentId,
          teamId,
          userId: team.captainId ?? userId,
          amount: tournament.regFee,
          currency: "MXN",
          method: "CASH",
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });
      await tx.team.update({ where: { id: teamId }, data: { payStatus: "PAID" } });
      return payment;
    });

    return res.json({ payment: result });
  } catch {
    return res.status(500).json({ error: "Error al confirmar pago en efectivo" });
  }
}
