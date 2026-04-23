import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  if (req.method === "GET") {
    const orgs = await prisma.organization.findMany({
      where: { members: { some: { userId } } },
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { members: true, tournaments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ organizations: orgs });
  }

  if (req.method === "POST") {
    const { name, logo } = req.body as { name?: string; logo?: string };
    if (!name?.trim()) return res.status(400).json({ error: "El nombre es requerido" });

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        logo,
        createdById: userId,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: { _count: { select: { members: true, tournaments: true } } },
    });

    return res.status(201).json({ organization: org });
  }

  return res.status(405).json({ error: "Método no permitido" });
}
