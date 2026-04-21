import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { sendPushToUser } from "@/lib/push";

async function canAccessRoom(userId: string, roomId: string): Promise<boolean> {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return false;
  if (room.teamId) {
    const m = await prisma.teamMember.findFirst({ where: { teamId: room.teamId, userId } });
    return !!m;
  }
  if (room.tournamentId) {
    // LIGA room — user must be a captain in this tournament
    const m = await prisma.teamMember.findFirst({
      where: { userId, isCaptain: true, team: { tournamentId: room.tournamentId } },
    });
    return !!m;
  }
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const roomId = req.query.roomId as string;

  if (req.method === "GET") {
    const allowed = await canAccessRoom(userId, roomId);
    if (!allowed) return res.status(403).json({ error: "Acceso denegado" });

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json({ messages: messages.reverse() });
  }

  if (req.method === "POST") {
    const allowed = await canAccessRoom(userId, roomId);
    if (!allowed) return res.status(403).json({ error: "Acceso denegado" });

    const { body } = req.body as { body: string };
    if (!body?.trim()) return res.status(400).json({ error: "Empty message" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (!user) return res.status(401).json({ error: "User not found" });

    const message = await prisma.chatMessage.create({
      data: { roomId, userId, userName: user.name, body: body.trim() },
    });

    // Send push notifications to other room members (best-effort, non-blocking)
    void (async () => {
      const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
      if (room?.teamId) {
        const members = await prisma.teamMember.findMany({
          where: { teamId: room.teamId, userId: { not: userId } },
          select: { userId: true },
        });
        for (const m of members) {
          await sendPushToUser(m.userId, { title: user.name, body: body.trim(), url: "/chat" });
        }
      }
    })();

    return res.json({ message });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
