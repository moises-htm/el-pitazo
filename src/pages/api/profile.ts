import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        country: true, lang: true, rating: true, role: true,
        onboardingData: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json({ user });
  }

  if (req.method === "PATCH") {
    const body = req.body as {
      name?: string;
      avatar?: string;
      country?: string;
      lang?: string;
      position?: string;
      preferredTeam?: string;
      bio?: string;
    };

    const data: any = {};
    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      data.name = body.name.trim();
    }
    if (typeof body.avatar === "string") {
      data.avatar = body.avatar;
    }
    if (typeof body.country === "string") data.country = body.country;
    if (typeof body.lang === "string") data.lang = body.lang;

    // Position / preferredTeam / bio go into onboardingData JSON
    if (body.position !== undefined || body.preferredTeam !== undefined || body.bio !== undefined) {
      const existing = await prisma.user.findUnique({
        where: { id: userId }, select: { onboardingData: true },
      });
      const merged = {
        ...((existing?.onboardingData as Record<string, any>) || {}),
        ...(body.position !== undefined ? { position: body.position } : {}),
        ...(body.preferredTeam !== undefined ? { preferredTeam: body.preferredTeam } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
      };
      data.onboardingData = merged;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Nada que actualizar" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        country: true, lang: true, rating: true, role: true, onboardingData: true,
      },
    });
    return res.json({ user: updated });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
