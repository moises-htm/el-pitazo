// GET /api/tournaments/[id]/calendar.ics — exports tournament matches as iCalendar
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function fmtIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query as { id: string };

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, fieldLocation: true, fieldAddress: true },
  });
  if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });

  const matches = await prisma.bracketMatch.findMany({
    where: { round: { tournamentId: id }, scheduledAt: { not: null } },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      field: { select: { name: true, address: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const now = fmtIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//El Pitazo//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(tournament.name)}`,
    `X-WR-TIMEZONE:UTC`,
  ];

  for (const m of matches) {
    if (!m.scheduledAt) continue;
    const start = new Date(m.scheduledAt);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const home = m.homeTeam?.name ?? "TBD";
    const away = m.awayTeam?.name ?? "TBD";
    const location = m.field?.name || tournament.fieldLocation || tournament.fieldAddress || "";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${m.id}@elpitazo`,
      `DTSTAMP:${now}`,
      `DTSTART:${fmtIcsDate(start)}`,
      `DTEND:${fmtIcsDate(end)}`,
      `SUMMARY:${escapeText(`${home} vs ${away}`)}`,
      `DESCRIPTION:${escapeText(`Torneo: ${tournament.name}`)}`,
      ...(location ? [`LOCATION:${escapeText(location)}`] : []),
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${tournament.name.replace(/[^a-z0-9]/gi, "-")}.ics"`);
  res.status(200).send(lines.join("\r\n"));
}
