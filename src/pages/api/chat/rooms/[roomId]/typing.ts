// POST /api/chat/rooms/[roomId]/typing — pings the typing registry
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { setTyping, clearTyping } from "@/lib/chat-typing";

async function canAccessRoom(userId: string, roomId: string): Promise<boolean> {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return false;
  if (room.teamId) {
    const m = await prisma.teamMember.findFirst({ where: { teamId: room.teamId, userId } });
    return !!m;
  }
  if (room.tournamentId) {
    const m = await prisma.teamMember.findFirst({
      where: { userId, isCaptain: true, team: { tournamentId: room.tournamentId } },
    });
    return !!m;
  }
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const userId = getUserId(req);
  if (!userId) return res.status(401).end();
  const roomId = req.query.roomId as string;
  if (!roomId) return res.status(400).end();

  const allowed = await canAccessRoom(userId, roomId);
  if (!allowed) return res.status(403).end();

  const stop = !!(req.body as { stop?: boolean })?.stop;
  if (stop) {
    clearTyping(roomId, userId);
    return res.status(204).end();
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  setTyping(roomId, userId, user?.name ?? "Alguien");
  return res.status(204).end();
}
