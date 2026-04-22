import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const orgId = req.query.id as string;
  const { email, role = "MEMBER" } = req.body as { email?: string; role?: string };

  if (!email?.trim()) return res.status(400).json({ error: "El email es requerido" });
  if (!["ADMIN", "MEMBER"].includes(role)) return res.status(400).json({ error: "Rol inválido" });

  // Verify requester is OWNER or ADMIN of the org
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return res.status(403).json({ error: "Sin permisos para invitar miembros" });
  }

  // Find the target user by email
  const target = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!target) return res.status(404).json({ error: "No se encontró usuario con ese email" });

  // Upsert membership
  const member = await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgId, userId: target.id } },
    create: { organizationId: orgId, userId: target.id, role: role as any },
    update: { role: role as any },
    include: { user: { select: { name: true, email: true } } },
  });

  return res.status(201).json({ member });
}
