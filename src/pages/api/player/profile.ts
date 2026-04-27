import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        country: true, lang: true, rating: true, role: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json({ user });
  }

  if (req.method === "PATCH") {
    const { name, country, lang } = (req.body || {}) as { name?: string; country?: string; lang?: string };
    const data: any = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof country === "string" && country.length === 2) data.country = country.toUpperCase();
    if (typeof lang === "string" && /^[a-z]{2}$/.test(lang)) data.lang = lang;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: "Nada que actualizar" });
    const user = await prisma.user.update({ where: { id: userId }, data, select: { id: true, name: true, country: true, lang: true } });
    return res.json({ user });
  }

  return res.status(405).end();
}
