import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { matchId } = req.query as { matchId: string };

  if (req.method === "GET") {
    try {
      const report = await prisma.refereeReport.findFirst({
        where: { matchId },
        include: {
          referee: { select: { name: true, avatar: true } },
        },
      });
      return res.json({ report });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudo obtener el reporte" });
    }
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const assignment = await prisma.refereeAssignment.findFirst({
      where: { matchId, refereeId: userId },
    });
    if (!assignment) return res.status(403).json({ error: "Solo el árbitro asignado puede enviar el reporte" });

    const match = await prisma.bracketMatch.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Partido no encontrado" });
    if (match.status !== "COMPLETED") {
      return res.status(400).json({ error: "Solo puedes reportar un partido finalizado" });
    }

    const { reportText, fieldCond, incidents } = req.body;

    try {
      const existing = await prisma.refereeReport.findFirst({
        where: { matchId, refereeId: userId },
      });

      const reportData = {
        reportText: reportText || null,
        fieldCond: fieldCond || null,
        incidents: incidents || [],
        submittedAt: new Date(),
      };

      const report = existing
        ? await prisma.refereeReport.update({ where: { id: existing.id }, data: reportData })
        : await prisma.refereeReport.create({ data: { matchId, refereeId: userId, ...reportData } });

      return res.status(201).json({ report });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudo guardar el reporte" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
