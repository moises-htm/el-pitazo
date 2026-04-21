import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            tournament: { select: { id: true, name: true, status: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, avatar: true, image: true },
    });

    const credentials = memberships.map((m) => ({
      id: m.id,
      number: m.number,
      position: m.position,
      user: { name: user?.name || "", avatar: user?.avatar || user?.image || null },
      team: {
        name: m.team.name,
        colorHex: m.team.colorHex,
        tournament: m.team.tournament,
      },
    }));

    return res.json({ credentials });
  } catch (err: any) {
    return res.status(500).json({ error: "No se pudo obtener la credencial" });
  }
}
