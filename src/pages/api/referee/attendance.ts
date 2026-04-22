import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { matchId } = req.body as { matchId: string };
  if (!matchId) return res.status(400).json({ error: "matchId requerido" });

  try {
    const assignment = await prisma.refereeAssignment.findFirst({
      where: { matchId, refereeId: userId },
    });
    if (!assignment) return res.status(404).json({ error: "Asignación no encontrada" });

    await prisma.refereeAssignment.update({
      where: { id: assignment.id },
      data: { status: "confirmed" },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Error al confirmar asistencia" });
  }
}
