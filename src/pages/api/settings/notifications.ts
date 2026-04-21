import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    return res.json({ prefs: prefs ?? { newMessage: true, scheduleChange: true, matchReminder: true } });
  }

  if (req.method === "PUT") {
    const { newMessage, scheduleChange, matchReminder } = req.body as any;
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      update: { newMessage, scheduleChange, matchReminder },
      create: { userId, newMessage, scheduleChange, matchReminder },
    });
    return res.json({ prefs });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
