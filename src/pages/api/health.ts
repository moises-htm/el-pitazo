import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const count = await prisma.user.count();
    return res.json({ users: count, status: "db-ok", uptime: process.uptime() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, status: "db-error" });
  }
}
