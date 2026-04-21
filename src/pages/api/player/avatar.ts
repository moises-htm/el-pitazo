import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { avatar } = req.body;
  if (!avatar || !avatar.startsWith("data:image/")) {
    return res.status(400).json({ error: "Invalid image data" });
  }

  await prisma.user.update({ where: { id: userId }, data: { avatar } });
  return res.json({ avatar });
}
