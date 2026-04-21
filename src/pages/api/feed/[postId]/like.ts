import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const postId = req.query.postId as string;

  if (req.method === "POST") {
    try {
      await prisma.$transaction([
        prisma.feedLike.create({ data: { postId, userId } }),
        prisma.feedPost.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
      ]);
    } catch {
      // Already liked — ignore unique constraint error
    }
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    const deleted = await prisma.feedLike.deleteMany({ where: { postId, userId } });
    if (deleted.count > 0) {
      await prisma.feedPost.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
    }
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
