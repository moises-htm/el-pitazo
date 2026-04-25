import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET env var must be set in production");
}
const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

export const config = { api: { bodyParser: false } };

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
  if (req.method !== "GET") return res.status(405).end();

  const tokenParam = req.query.token as string;
  if (!tokenParam) return res.status(401).end();

  let userId: string;
  try {
    const payload = jwt.verify(tokenParam, JWT_SECRET) as { userId: string };
    userId = payload.userId;
  } catch {
    return res.status(401).end();
  }

  const roomId = req.query.roomId as string;
  if (!roomId) return res.status(400).end();

  const allowed = await canAccessRoom(userId, roomId);
  if (!allowed) return res.status(403).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const lastEventId = req.headers["last-event-id"] as string | undefined;
  const sinceParam = (req.query.since as string) || lastEventId;
  let since: Date | null = null;
  if (sinceParam) {
    const d = new Date(sinceParam);
    if (!isNaN(d.getTime())) since = d;
  }

  let closed = false;

  const send = (line: string) => {
    if (!closed) {
      try { res.write(line); } catch { closed = true; }
    }
  };

  const poll = async () => {
    if (closed) return;
    try {
      const msgs = await prisma.chatMessage.findMany({
        where: {
          roomId,
          ...(since ? { createdAt: { gt: since } } : {}),
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      if (msgs.length > 0) {
        for (const msg of msgs) {
          if (closed) break;
          send(`id: ${msg.createdAt.toISOString()}\n`);
          send(`data: ${JSON.stringify(msg)}\n\n`);
          since = msg.createdAt;
        }
      } else {
        send(": heartbeat\n\n");
      }
    } catch {
      send(": error\n\n");
    }
  };

  await poll();

  const interval = setInterval(poll, 2000);

  const timeout = setTimeout(() => {
    closed = true;
    clearInterval(interval);
    try { res.end(); } catch {}
  }, 55000);

  const cleanup = () => {
    closed = true;
    clearInterval(interval);
    clearTimeout(timeout);
  };

  req.socket?.on("close", cleanup);
  req.on("close", cleanup);
}
