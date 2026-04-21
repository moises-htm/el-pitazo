import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    // Get user's team memberships
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: { team: { include: { tournament: true } } },
    });

    const rooms: any[] = [];

    for (const m of memberships) {
      // TEAM room — auto-create if missing
      let teamRoom = await prisma.chatRoom.findFirst({
        where: { type: "TEAM", teamId: m.teamId },
      });
      if (!teamRoom) {
        teamRoom = await prisma.chatRoom.create({
          data: {
            type: "TEAM",
            teamId: m.teamId,
            tournamentId: m.team.tournamentId,
            name: `Equipo: ${m.team.name}`,
          },
        });
      }
      if (!rooms.find((r) => r.id === teamRoom!.id)) {
        rooms.push({ ...teamRoom, unread: 0 });
      }

      // LIGA room — only for captains
      if (m.isCaptain) {
        let ligaRoom = await prisma.chatRoom.findFirst({
          where: { type: "LIGA", tournamentId: m.team.tournamentId },
        });
        if (!ligaRoom) {
          ligaRoom = await prisma.chatRoom.create({
            data: {
              type: "LIGA",
              tournamentId: m.team.tournamentId,
              name: `Liga: ${m.team.tournament.name}`,
            },
          });
        }
        if (!rooms.find((r) => r.id === ligaRoom!.id)) {
          rooms.push({ ...ligaRoom, unread: 0 });
        }
      }
    }

    return res.json({ rooms });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
