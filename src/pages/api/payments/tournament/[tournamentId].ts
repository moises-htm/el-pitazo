import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });
  const { tournamentId } = req.query as { tournamentId: string };

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { creatorId: true, regFee: true },
    });
    if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });
    if (tournament.creatorId !== userId) return res.status(403).json({ error: "Solo el organizador puede ver los pagos" });

    const [payments, teams] = await Promise.all([
      prisma.payment.findMany({
        where: { tournamentId },
        include: {
          team: { select: { name: true, payStatus: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.team.findMany({
        where: { tournamentId },
        select: { id: true, name: true, payStatus: true, payAmount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const completed = payments.filter((p) => p.status === "COMPLETED");
    const pending = payments.filter((p) => p.status === "PENDING");

    const byMethod = payments.reduce<Record<string, number>>((acc, p) => {
      if (p.status === "COMPLETED") {
        acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
      }
      return acc;
    }, {});

    return res.json({
      payments,
      teams,
      totalCollected: completed.reduce((s, p) => s + Number(p.amount), 0),
      totalPending: pending.reduce((s, p) => s + Number(p.amount), 0),
      byMethod,
      teamsPaid: teams.filter((t) => t.payStatus === "PAID").length,
      teamsPending: teams.filter((t) => t.payStatus !== "PAID").length,
    });
  } catch {
    return res.status(500).json({ error: "Error al obtener pagos del torneo" });
  }
}
