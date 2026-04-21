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
    const assignments = await prisma.refereeAssignment.findMany({
      where: { refereeId: userId, fee: { not: null } },
      select: { fee: true, paid: true },
    });

    const total = assignments.reduce((s, a) => s + Number(a.fee || 0), 0);
    const paid = assignments.filter((a) => a.paid).reduce((s, a) => s + Number(a.fee || 0), 0);
    const pending = total - paid;
    const totalMatches = await prisma.refereeAssignment.count({ where: { refereeId: userId } });

    return res.json({ total, paid, pending, totalMatches });
  } catch {
    return res.status(500).json({ error: "No se pudo obtener las ganancias" });
  }
}
