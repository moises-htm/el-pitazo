import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          organization: { select: { id: true, name: true, logo: true } },
          fields: true,
          _count: { select: { teams: true } },
        },
      });
      if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });
      return res.json({ tournament });
    } catch {
      return res.status(500).json({ error: "Error al obtener torneo" });
    }
  }

  if (req.method === "PATCH") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const existing = await prisma.tournament.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Torneo no encontrado" });
      if (existing.creatorId !== userId) {
        return res.status(403).json({ error: "Sin permisos" });
      }
      const data = req.body as any;
      const allowed: Record<string, any> = {};
      const fields = [
        "name", "description", "type", "maxTeams", "status", "startDate", "endDate",
        "fieldLocation", "fieldAddress", "regFee", "currency", "websiteUrl",
        "coverImage", "isPublic", "minSkill", "maxSkill", "rules",
      ];
      for (const f of fields) if (f in data) allowed[f] = data[f];
      if (allowed.regFee !== undefined) allowed.regFee = parseFloat(allowed.regFee) || 0;
      if (allowed.startDate) allowed.startDate = new Date(allowed.startDate);
      if (allowed.endDate) allowed.endDate = new Date(allowed.endDate);
      const tournament = await prisma.tournament.update({ where: { id }, data: allowed });
      return res.json({ tournament });
    } catch {
      return res.status(500).json({ error: "Error al actualizar torneo" });
    }
  }

  if (req.method === "DELETE") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const existing = await prisma.tournament.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Torneo no encontrado" });
      if (existing.creatorId !== userId) {
        return res.status(403).json({ error: "Sin permisos" });
      }
      await prisma.tournament.delete({ where: { id } });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: "Error al eliminar torneo" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
