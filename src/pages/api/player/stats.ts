import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
    return payload.userId;
  } catch { return null; }
}

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
  } catch {
    return res.status(500).json({ error: "No se pudo obtener las estadísticas" });
  }
}
