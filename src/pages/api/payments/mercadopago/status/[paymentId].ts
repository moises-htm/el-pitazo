import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });
  const { paymentId } = req.query as { paymentId: string };

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        team: { select: { name: true } },
        tournament: { select: { name: true } },
      },
    });

    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });

    const tournament = payment.tournamentId
      ? await prisma.tournament.findUnique({ where: { id: payment.tournamentId }, select: { creatorId: true } })
      : null;

    const isOwner = payment.userId === userId || tournament?.creatorId === userId;
    if (!isOwner) return res.status(403).json({ error: "Sin acceso a este pago" });

    return res.json({ payment });
  } catch {
    return res.status(500).json({ error: "Error al obtener estado del pago" });
  }
}
