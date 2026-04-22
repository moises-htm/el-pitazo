import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const orgId = req.query.id as string;

  // Verify user belongs to the org
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
  });
  if (!membership) return res.status(403).json({ error: "No eres miembro de esta organización" });

  if (req.method === "GET") {
    const tournaments = await prisma.tournament.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { name: true } },
        _count: { select: { teams: true } },
      },
    });
    return res.json({ tournaments });
  }

  return res.status(405).json({ error: "Método no permitido" });
}
