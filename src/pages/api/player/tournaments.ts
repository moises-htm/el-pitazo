import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
    return payload.userId;
  } catch { return null; }
}

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
            tournament: {
              select: { id: true, name: true, status: true, startDate: true, endDate: true, type: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const tournaments = memberships.map((m) => ({
      id: m.team.tournament.id,
      name: m.team.tournament.name,
      status: m.team.tournament.status,
      startDate: m.team.tournament.startDate,
      endDate: m.team.tournament.endDate,
      type: m.team.tournament.type,
      teamName: m.team.name,
      isCaptain: m.isCaptain,
    }));

    return res.json({ tournaments });
  } catch {
    return res.status(500).json({ error: "No se pudo obtener los torneos" });
  }
}
