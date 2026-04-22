import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const playerId = req.query.playerId as string;
  if (!playerId) return res.status(400).json({ error: "Missing playerId" });

  const player = await prisma.user.findUnique({
    where: { id: playerId },
    select: { id: true, name: true, avatar: true, rating: true },
  });
  if (!player) return res.status(404).json({ error: "Jugador no encontrado" });

  const [posts, goals, assists, yellowCards, redCards, matches] = await Promise.all([
    prisma.feedPost.findMany({
      where: { uploaderId: playerId },
      orderBy: { likesCount: "desc" },
      take: 20,
      select: {
        id: true,
        videoUrl: true,
        thumbnailUrl: true,
        caption: true,
        likesCount: true,
        commentsCount: true,
        createdAt: true,
      },
    }),
    prisma.matchEvent.count({ where: { playerId, eventType: "GOAL" } }),
    prisma.matchEvent.count({ where: { playerId, eventType: "ASSIST" } }),
    prisma.matchEvent.count({ where: { playerId, eventType: "YELLOW_CARD" } }),
    prisma.matchEvent.count({ where: { playerId, eventType: "RED_CARD" } }),
    prisma.matchEvent
      .findMany({
        where: { playerId },
        select: { matchId: true },
        distinct: ["matchId"],
      })
      .then((r) => r.length),
  ]);

  return res.json({
    player,
    stats: { goals, assists, yellowCards, redCards, matches },
    posts,
  });
}
