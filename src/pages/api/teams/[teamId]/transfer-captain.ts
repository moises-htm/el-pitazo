import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const teamId = req.query.teamId as string;
  const { newCaptainUserId } = req.body as { newCaptainUserId: string };

  if (!newCaptainUserId) return res.status(400).json({ error: "newCaptainUserId is required" });

  // Validate caller is current captain
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (team.captainId !== userId) return res.status(403).json({ error: "Only the current captain can transfer captaincy" });

  // Validate new captain is a team member
  const newCaptainMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: newCaptainUserId },
  });
  if (!newCaptainMember) return res.status(400).json({ error: "New captain must be a team member" });

  // Perform transfer in a transaction
  const [updatedTeam] = await prisma.$transaction([
    prisma.team.update({
      where: { id: teamId },
      data: { captainId: newCaptainUserId },
      include: { captain: { select: { id: true, name: true } }, members: { include: { user: { select: { id: true, name: true } } } } },
    }),
    prisma.teamMember.updateMany({
      where: { teamId, userId },
      data: { isCaptain: false },
    }),
    prisma.teamMember.updateMany({
      where: { teamId, userId: newCaptainUserId },
      data: { isCaptain: true },
    }),
  ]);

  return res.json({ team: updatedTeam });
}
