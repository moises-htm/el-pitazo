// GET /api/tournaments/[id]/standings.csv — CSV export (opens in Excel)
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { id } = req.query as { id: string };

  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { name: true } });
  if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });

  const matches = await prisma.bracketMatch.findMany({
    where: {
      round: { tournamentId: id },
      status: "COMPLETED",
      homeTeamId: { not: null },
      awayTeamId: { not: null },
      homeScore: { not: null },
      awayScore: { not: null },
    },
    select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  });

  const teamIds = Array.from(new Set([
    ...matches.map((m) => m.homeTeamId!),
    ...matches.map((m) => m.awayTeamId!),
  ]));
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } });
  const tname = new Map(teams.map((t) => [t.id, t.name]));

  type Row = { name: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number };
  const acc = new Map<string, Row>();
  const get = (id: string) => {
    let r = acc.get(id);
    if (!r) { r = { name: tname.get(id) ?? "?", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; acc.set(id, r); }
    return r;
  };
  for (const m of matches) {
    const h = get(m.homeTeamId!);
    const a = get(m.awayTeamId!);
    h.played++; a.played++;
    h.gf += m.homeScore!; h.ga += m.awayScore!;
    a.gf += m.awayScore!; a.ga += m.homeScore!;
    if (m.homeScore! > m.awayScore!) { h.won++; h.pts += 3; a.lost++; }
    else if (m.homeScore! < m.awayScore!) { a.won++; a.pts += 3; h.lost++; }
    else { h.drawn++; a.drawn++; h.pts++; a.pts++; }
    h.gd = h.gf - h.ga; a.gd = a.gf - a.ga;
  }
  const rows = Array.from(acc.values()).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  const header = ["Pos", "Equipo", "Jugados", "Ganados", "Empatados", "Perdidos", "GF", "GC", "DG", "Puntos"];
  const lines = [header.join(",")];
  rows.forEach((r, i) => {
    lines.push([
      String(i + 1),
      csvEscape(r.name),
      String(r.played),
      String(r.won),
      String(r.drawn),
      String(r.lost),
      String(r.gf),
      String(r.ga),
      String(r.gd),
      String(r.pts),
    ].join(","));
  });

  // BOM for Excel UTF-8
  const csv = "﻿" + lines.join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="standings-${tournament.name.replace(/[^a-z0-9]/gi, "-")}.csv"`);
  res.status(200).send(csv);
}
