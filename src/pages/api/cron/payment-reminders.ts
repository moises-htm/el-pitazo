// GET /api/cron/payment-reminders — push reminders to captains of unpaid teams
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { verifyCronSecret } from "@/lib/cron-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = verifyCronSecret(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    const now = new Date();
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 3600 * 1000);

    const teams = await prisma.team.findMany({
      where: {
        payStatus: { in: ["PENDING", "PARTIAL"] },
        tournament: {
          status: { in: ["DRAFT", "ACTIVE"] },
          startDate: { gte: now, lte: sixDaysFromNow },
          regFee: { gt: 0 },
        },
      },
      include: {
        tournament: { select: { id: true, name: true, regFee: true, currency: true, startDate: true } },
      },
    });

    let sent = 0;
    for (const team of teams) {
      if (!team.captainId || !team.tournament) continue;
      const days = Math.max(0, Math.ceil((team.tournament.startDate!.getTime() - now.getTime()) / (24 * 3600 * 1000)));
      const payload = {
        title: "💸 Pago pendiente — El Pitazo",
        body: `Tu equipo "${team.name}" debe ${Number(team.tournament.regFee).toLocaleString("es-MX")} ${team.tournament.currency} para "${team.tournament.name}" (en ${days} día${days === 1 ? "" : "s"})`,
        url: `/tournament/${team.tournament.id}`,
      };
      await sendPushToUser(team.captainId, payload);
      sent++;
    }

    return res.json({ ok: true, teamsReminded: teams.length, notificationsSent: sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al enviar recordatorios de pago" });
  }
}
