import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { Prisma, TournamentStatus } from "@prisma/client";

const VALID_STATUSES = new Set<string>(Object.values(TournamentStatus));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const {
    q,
    location,
    type,
    status,
    minFee,
    maxFee,
    minSkill,
    maxSkill,
    sortBy = "newest",
    page = "1",
    limit = "20",
  } = req.query as Record<string, string>;

  const where: Prisma.TournamentWhereInput = { isPublic: true };

  if (status && VALID_STATUSES.has(status)) {
    where.status = status as TournamentStatus;
  } else {
    where.status = TournamentStatus.ACTIVE;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { fieldLocation: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (location) {
    where.fieldLocation = { contains: location, mode: "insensitive" };
  }

  if (type) {
    where.type = type as any;
  }

  if (minFee || maxFee) {
    where.regFee = {};
    if (minFee) (where.regFee as any).gte = parseFloat(minFee);
    if (maxFee) (where.regFee as any).lte = parseFloat(maxFee);
  }

  if (minSkill) where.maxSkill = { gte: parseInt(minSkill) };
  if (maxSkill) where.minSkill = { lte: parseInt(maxSkill) };

  const orderByMap: Record<string, Prisma.TournamentOrderByWithRelationInput> = {
    newest: { createdAt: "desc" },
    soonest: { startDate: "asc" },
    cheapest: { regFee: "asc" },
    popular: { teams: { _count: "desc" } },
  };
  const orderBy = orderByMap[sortBy] ?? orderByMap.newest;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        creator: { select: { name: true } },
        _count: { select: { teams: true } },
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  return res.json({ tournaments, total, page: pageNum, limit: limitNum });
}
