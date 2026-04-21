import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    // Get all schedule change requests for tournaments the user created
    const requests = await prisma.scheduleChangeRequest.findMany({
      where: {
        status: "PENDING",
        captainBApproved: true,
        refereeApproved: true,
        match: { round: { tournament: { creatorId: userId } } },
      },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            round: { include: { tournament: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ requests });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
