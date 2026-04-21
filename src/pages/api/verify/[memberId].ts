import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { memberId } = req.query as { memberId: string };

  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { name: true, avatar: true, image: true } },
        team: {
          include: {
            tournament: { select: { name: true, status: true } },
          },
        },
      },
    });

    if (!member) {
      return res.json({ eligible: false, error: "Jugador no encontrado" });
    }

    return res.json({
      eligible: true,
      member: {
        id: member.id,
        number: member.number,
        position: member.position,
        user: {
          name: member.user.name,
          avatar: member.user.avatar || member.user.image || null,
        },
        team: { name: member.team.name, colorHex: member.team.colorHex },
        tournament: { name: member.team.tournament.name, status: member.team.tournament.status },
      },
    });
  } catch {
    return res.status(500).json({ error: "Error de verificación" });
  }
}
