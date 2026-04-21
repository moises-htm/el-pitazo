import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const roomId = req.query.roomId as string;

  if (req.method === "GET") {
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return res.json({ messages });
  }

  if (req.method === "POST") {
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
    return res.json({ message });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
