// /api/tournaments — All tournament operations
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { TournamentStatus } from "@prisma/client";

const VALID_STATUSES = new Set<string>(Object.values(TournamentStatus));

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
    const rawStatus = (req.query.status as string) || "ACTIVE";
    const status: TournamentStatus = VALID_STATUSES.has(rawStatus)
      ? (rawStatus as TournamentStatus)
      : TournamentStatus.ACTIVE;
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");

    const where = { status, isPublic: true };
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: "desc" },
        include: { creator: { select: { name: true } } },
      }),
      prisma.tournament.count({ where }),
    ]);

    return res.json({ tournaments, total, page, limit });
  }

  if (req.method === "POST") {
    const token = verifyToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const data = JSON.parse(JSON.stringify(req.body)) as any;
      const creatorId = (token as any).userId;
      const { organizationId, ...rest } = data;

      // If organizationId is provided, verify the user is ADMIN+ in that org
      if (organizationId) {
        const membership = await prisma.organizationMember.findUnique({
          where: { organizationId_userId: { organizationId, userId: creatorId } },
        });
        if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
          return res.status(403).json({ error: "Sin permisos para crear torneos en esta organización" });
        }
      }

      const tournament = await prisma.tournament.create({
        data: {
          ...rest,
          creatorId,
          regFee: parseFloat(rest.regFee) || 0,
          ...(organizationId ? { organizationId } : {}),
        },
      });
      return res.json({ tournament });
    } catch (err: any) {
      if (err.code === "P2002") return res.status(409).json({ error: "Ya existe un torneo con ese nombre" });
      return res.status(500).json({ error: "Error al crear el torneo" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
