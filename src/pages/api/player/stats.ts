import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const events = await prisma.matchEvent.groupBy({
      by: ["eventType"],
      where: { playerId: userId },
      _count: { eventType: true },
    });

    const matchIds = await prisma.matchEvent.findMany({
      where: { playerId: userId },
      select: { matchId: true },
      distinct: ["matchId"],
    });

    const countMap: Record<string, number> = {};
    for (const e of events) countMap[e.eventType] = e._count.eventType;

    return res.json({
      matches: matchIds.length,
      goals: countMap["GOAL"] || 0,
      assists: countMap["ASSIST"] || 0,
      yellowCards: countMap["YELLOW_CARD"] || 0,
      redCards: countMap["RED_CARD"] || 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo obtener las estadísticas" });
  }
}
