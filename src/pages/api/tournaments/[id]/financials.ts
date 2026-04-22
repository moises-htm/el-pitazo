import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.query as { id: string };

  try {
    const payments = await prisma.payment.findMany({
      where: { tournamentId: id },
      include: { team: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const completed = payments.filter((p) => p.status === "COMPLETED");
    const pending = payments.filter((p) => p.status !== "COMPLETED");
    const totalIncome = completed.reduce((s, p) => s + Number(p.amount), 0);
    const pendingIncome = pending.reduce((s, p) => s + Number(p.amount), 0);

    const teams = await prisma.team.findMany({ where: { tournamentId: id }, select: { payStatus: true } });
    const teamsPaid = teams.filter((t) => t.payStatus === "PAID").length;
    const teamsPending = teams.filter((t) => t.payStatus !== "PAID").length;

    const refFeeResult = await prisma.refereeAssignment.aggregate({
      _sum: { fee: true },
      where: { paid: true, match: { round: { tournamentId: id } } },
    });
    const totalExpenses = Number(refFeeResult._sum.fee ?? 0);

    return res.json({
      totalIncome,
      pendingIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      teamsPaid,
      teamsPending,
      payments,
    });
  } catch { return res.status(500).json({ error: "No se pudo obtener las finanzas" }); }
}
