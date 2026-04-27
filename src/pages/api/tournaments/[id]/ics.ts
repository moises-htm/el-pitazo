import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeText(s: string): string {
  return s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { id } = req.query as { id: string };

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { name: true } });
    if (!tournament) return res.status(404).end();

    const matches = await prisma.bracketMatch.findMany({
      where: { round: { tournamentId: id }, scheduledAt: { not: null } },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        field: { select: { name: true, address: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//El Pitazo//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeText(tournament.name)}`,
    ];

    for (const m of matches) {
      if (!m.scheduledAt) continue;
      const start = new Date(m.scheduledAt);
      const end = new Date(start.getTime() + 90 * 60_000);
      const title = `${m.homeTeam?.name ?? "TBD"} vs ${m.awayTeam?.name ?? "TBD"}`;
      const loc = m.field?.address || m.field?.name || "";
      lines.push(
        "BEGIN:VEVENT",
        `UID:${m.id}@elpitazo.app`,
        `DTSTAMP:${toIcsDate(new Date())}`,
        `DTSTART:${toIcsDate(start)}`,
        `DTEND:${toIcsDate(end)}`,
        `SUMMARY:${escapeText(title)}`,
        `LOCATION:${escapeText(loc)}`,
        `DESCRIPTION:${escapeText(tournament.name)}`,
        "END:VEVENT"
      );
    }

    lines.push("END:VCALENDAR");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${id}.ics"`);
    return res.send(lines.join("\r\n"));
  } catch {
    return res.status(500).end();
  }
}
