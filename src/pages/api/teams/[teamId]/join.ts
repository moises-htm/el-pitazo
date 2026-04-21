import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const teamId = req.query.teamId as string;

  // Check already a member
  const existing = await prisma.teamMember.findFirst({ where: { teamId, userId } });
  if (existing) return res.status(409).json({ error: "Ya eres miembro de este equipo" });

  // Find max jersey number and assign next
  const agg = await prisma.teamMember.aggregate({ where: { teamId }, _max: { number: true } });
  const nextNumber = (agg._max.number ?? 0) + 1;

  const [member] = await prisma.$transaction([
    prisma.teamMember.create({
      data: { teamId, userId, number: nextNumber, isCaptain: false },
    }),
    prisma.team.update({
      where: { id: teamId },
      data: { playersCount: { increment: 1 } },
    }),
  ]);

  return res.json({ member });
}
