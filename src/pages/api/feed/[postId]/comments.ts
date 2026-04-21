import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const postId = req.query.postId as string;

  if (req.method === "GET") {
    const comments = await prisma.feedComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return res.json({ comments });
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { body } = req.body as { body: string };
    if (!body?.trim()) return res.status(400).json({ error: "Comentario vacío" });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const [comment] = await prisma.$transaction([
      prisma.feedComment.create({ data: { postId, userId, userName: user?.name || "Usuario", body: body.trim() } }),
      prisma.feedPost.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
    ]);
    return res.json({ comment });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
