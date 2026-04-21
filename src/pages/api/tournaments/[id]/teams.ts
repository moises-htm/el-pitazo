import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    try {
      const teams = await prisma.team.findMany({
        where: { tournamentId: id },
        include: { captain: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      });
      return res.json({ teams });
    } catch { return res.status(500).json({ error: "No se pudo obtener los equipos" }); }
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { name, colorHex, payAmount } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
      const team = await prisma.team.create({
        data: { tournamentId: id, name: name.trim(), colorHex, payAmount: parseFloat(payAmount) || 0 },
      });
      return res.json({ team });
    } catch (err: any) {
      if (err.code === "P2002") return res.status(409).json({ error: "Ya existe un equipo con ese nombre en este torneo" });
      return res.status(500).json({ error: "No se pudo crear el equipo" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
