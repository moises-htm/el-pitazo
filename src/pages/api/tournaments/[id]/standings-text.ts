// GET /api/tournaments/[id]/standings-text — plain-text standings for WhatsApp/share
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

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

  const teamIds = new Set<string>();
  for (const m of matches) { if (m.homeTeamId) teamIds.add(m.homeTeamId); if (m.awayTeamId) teamIds.add(m.awayTeamId); }
  const teams = await prisma.team.findMany({ where: { id: { in: Array.from(teamIds) } }, select: { id: true, name: true } });
  const tname = new Map(teams.map((t) => [t.id, t.name]));

  type Row = { name: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number };
  const acc = new Map<string, Row>();
  const get = (id: string) => {
    let r = acc.get(id);
    if (!r) { r = { name: tname.get(id) ?? "?", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }; acc.set(id, r); }
    return r;
  };

  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const h = get(m.homeTeamId);
    const a = get(m.awayTeamId);
    h.played++; a.played++;
    h.gf += m.homeScore!; h.ga += m.awayScore!;
    a.gf += m.awayScore!; a.ga += m.homeScore!;
    if (m.homeScore! > m.awayScore!) { h.won++; h.pts += 3; a.lost++; }
    else if (m.homeScore! < m.awayScore!) { a.won++; a.pts += 3; h.lost++; }
    else { h.drawn++; a.drawn++; h.pts++; a.pts++; }
  }

  const rows = Array.from(acc.values()).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);

  const lines: string[] = [];
  lines.push(`🏆 ${tournament.name}`);
  lines.push("");
  lines.push("Tabla de posiciones");
  lines.push("");
  if (rows.length === 0) {
    lines.push("Sin partidos jugados todavía");
  } else {
    rows.forEach((r, i) => {
      const trophy = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      lines.push(`${trophy} ${r.name} — ${r.pts} pts (${r.won}-${r.drawn}-${r.lost}, ${r.gf}:${r.ga})`);
    });
  }
  lines.push("");
  lines.push("Vía El Pitazo ⚽");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(lines.join("\n"));
}
