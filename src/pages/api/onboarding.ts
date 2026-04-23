import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingComplete: true, onboardingData: true, role: true, name: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(user);
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const { onboardingData, complete } = req.body as {
      onboardingData?: Record<string, unknown>;
      complete?: boolean;
    };
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(onboardingData !== undefined && { onboardingData: onboardingData as Prisma.InputJsonValue }),
        ...(complete && { onboardingComplete: true }),
      },
      select: { onboardingComplete: true, onboardingData: true },
    });
    return res.json(user);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Método no permitido" });
}
