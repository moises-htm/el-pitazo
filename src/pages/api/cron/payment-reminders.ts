import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const REMINDER_KEY_PREFIX = "pay-reminder:";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Optional shared secret guard for Vercel cron
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Find teams that haven't paid in active tournaments starting in <= 7 days
    const now = new Date();
    const inSeven = new Date(now.getTime() + 7 * 86400_000);

    const teams = await prisma.team.findMany({
      where: {
        payStatus: { in: ["PENDING", "PARTIAL"] },
        tournament: {
          status: { in: ["ACTIVE", "DRAFT"] },
          startDate: { gte: now, lte: inSeven },
          regFee: { gt: 0 },
        },
      },
      include: {
        tournament: { select: { id: true, name: true, regFee: true, currency: true, startDate: true } },
        captain: { select: { id: true, name: true } },
      },
    });

    let sent = 0;
    for (const team of teams) {
      if (!team.captainId) continue;
      const days = Math.max(0, Math.round(((team.tournament.startDate?.getTime() || now.getTime()) - now.getTime()) / 86400_000));
      await sendPushToUser(team.captainId, {
        title: "Pago de inscripción pendiente",
        body: `${team.name} en ${team.tournament.name}: faltan ${days} día(s) para iniciar.`,
        url: `/tournament/${team.tournament.id}`,
      });
      sent++;
    }

    return res.json({ ok: true, sent, scanned: teams.length });
  } catch (err) {
    return res.status(500).json({ error: "Cron failed" });
  }
}
