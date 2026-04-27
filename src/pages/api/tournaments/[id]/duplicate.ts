import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.query as { id: string };

  try {
    const src = await prisma.tournament.findUnique({ where: { id } });
    if (!src) return res.status(404).json({ error: "Torneo no encontrado" });

    const copy = await prisma.tournament.create({
      data: {
        creatorId: userId,
        organizationId: src.organizationId,
        name: `${src.name} (copia)`,
        description: src.description,
        type: src.type,
        maxTeams: src.maxTeams,
        status: "DRAFT",
        startDate: src.startDate,
        endDate: src.endDate,
        fieldLocation: src.fieldLocation,
        fieldAddress: src.fieldAddress,
        fieldLat: src.fieldLat,
        fieldLng: src.fieldLng,
        rules: src.rules ?? undefined,
        regFee: src.regFee,
        currency: src.currency,
        websiteUrl: src.websiteUrl,
        coverImage: src.coverImage,
        isPublic: false,
        minSkill: src.minSkill,
        maxSkill: src.maxSkill,
      },
    });

    return res.json({ tournament: copy });
  } catch {
    return res.status(500).json({ error: "Error al duplicar el torneo" });
  }
}
