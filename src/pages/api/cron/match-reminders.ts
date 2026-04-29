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
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const matches = await prisma.bracketMatch.findMany({
      where: {
        scheduledAt: { gte: windowStart, lte: windowEnd },
        status: "SCHEDULED",
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      include: {
        homeTeam: {
          include: { members: { select: { userId: true } } },
        },
        awayTeam: {
          include: { members: { select: { userId: true } } },
        },
        field: { select: { name: true } },
        refereeAssign: { select: { refereeId: true } },
        round: { include: { tournament: { select: { name: true } } } },
      },
    });

    let sent = 0;
    for (const match of matches) {
      const time = match.scheduledAt!.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
      const fieldName = match.field?.name ?? "campo por definir";
      const home = match.homeTeam!.name;
      const away = match.awayTeam!.name;

      const payload = {
        title: "⚽ Recordatorio — El Pitazo",
        body: `Mañana: ${home} vs ${away} a las ${time} en ${fieldName}`,
        url: `/match/${match.id}`,
      };

      const userIds = new Set<string>();
      match.homeTeam!.members.forEach((m) => userIds.add(m.userId));
      match.awayTeam!.members.forEach((m) => userIds.add(m.userId));
      if (match.refereeAssign) userIds.add(match.refereeAssign.refereeId);

      for (const uid of userIds) {
        await sendPushToUser(uid, payload);
        sent++;
      }
    }

    return res.json({ ok: true, matchesChecked: matches.length, notificationsSent: sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al enviar recordatorios" });
  }
}
