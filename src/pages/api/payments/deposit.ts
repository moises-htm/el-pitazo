import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { teamId, tournamentId, amount, method = "CASH" } = req.body as {
    teamId?: string; tournamentId?: string; amount?: number; method?: string;
  };

  if (!teamId || !tournamentId || !amount || amount <= 0) {
    return res.status(400).json({ error: "teamId, tournamentId y amount > 0 son requeridos" });
  }

  try {
    const [tournament, team] = await Promise.all([
      prisma.tournament.findUnique({ where: { id: tournamentId }, select: { creatorId: true, regFee: true, currency: true } }),
      prisma.team.findUnique({ where: { id: teamId }, select: { captainId: true, payAmount: true } }),
    ]);
    if (!tournament || !team) return res.status(404).json({ error: "No encontrado" });
    if (tournament.creatorId !== userId && team.captainId !== userId) {
      return res.status(403).json({ error: "Sin permisos" });
    }

    const fee = Number(tournament.regFee);
    const previousPaid = await prisma.payment.aggregate({
      where: { teamId, status: "COMPLETED" },
      _sum: { amount: true },
    });
    const totalPaid = Number(previousPaid._sum.amount ?? 0) + amount;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tournamentId,
          teamId,
          userId: team.captainId ?? userId,
          amount,
          currency: tournament.currency,
          method: method as any,
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });
      let nextStatus: "PAID" | "PARTIAL" | "PENDING" = "PARTIAL";
      if (totalPaid >= fee) nextStatus = "PAID";
      else if (totalPaid <= 0) nextStatus = "PENDING";
      await tx.team.update({ where: { id: teamId }, data: { payStatus: nextStatus } });
      return { payment, totalPaid, balance: Math.max(0, fee - totalPaid), status: nextStatus };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Error al registrar el depósito" });
  }
}
