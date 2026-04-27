import type { NextApiRequest, NextApiResponse } from "next";
import { getUserId } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

const TTL_MS = 4_000;

type Entry = { name: string; ts: number };
const g = globalThis as any;
if (!g.__typingMap) g.__typingMap = new Map<string, Map<string, Entry>>();
const typingMap: Map<string, Map<string, Entry>> = g.__typingMap;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const roomId = req.query.roomId as string;

  let room = typingMap.get(roomId);
  if (!room) {
    room = new Map();
    typingMap.set(roomId, room);
  }

  if (req.method === "POST") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (!user) return res.status(401).json({ error: "User not found" });
    room.set(userId, { name: user.name, ts: Date.now() });
    return res.json({ ok: true });
  }

  if (req.method === "GET") {
    const now = Date.now();
    const active: string[] = [];
    for (const [uid, entry] of room.entries()) {
      if (now - entry.ts > TTL_MS) {
        room.delete(uid);
        continue;
      }
      if (uid !== userId) active.push(entry.name);
    }
    return res.json({ typing: active });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
