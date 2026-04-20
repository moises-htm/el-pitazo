// /api/tournaments — All tournament operations
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function verifyToken(req: NextApiRequest) {
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const status = (req.query.status as string) || "ACTIVE";
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");

    const tournaments = await prisma.tournament.findMany({
      where: { status, isPublic: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startDate: "desc" },
      include: { creator: { select: { name: true } } },
    });
    const total = await prisma.tournament.count({ where: { status, isPublic: true } });

    return res.json({ tournaments, total, page, limit });
  }

  if (req.method === "POST") {
    const token = verifyToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const data = JSON.parse(JSON.stringify(req.body)) as any;
      const tournament = await prisma.tournament.create({
        data: {
          ...data,
          creatorId: (token as any).userId,
          regFee: parseFloat(data.regFee) || 0,
        },
      });
      return res.json({ tournament });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
