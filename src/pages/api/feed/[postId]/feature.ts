import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user?.role?.includes("ORGANIZER")) return res.status(403).json({ error: "Solo organizadores" });

  const postId = req.query.postId as string;
  await prisma.feedPost.update({ where: { id: postId }, data: { isFeatured: true } });
  return res.json({ ok: true });
}
