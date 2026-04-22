import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  const page = parseInt((req.query.page as string) || "1");
  const limit = parseInt((req.query.limit as string) || "50");
  const status = req.query.status as string | undefined;

  const where = {
    OR: [
      { creatorId: userId },
      { organization: { members: { some: { userId, role: { in: ["OWNER", "ADMIN"] as any } } } } },
    ],
    ...(status ? { status: status as any } : {}),
  };

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { name: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  return res.json({ tournaments, total, page, limit });
}
