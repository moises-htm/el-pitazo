import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function csvEscape(s: any): string {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows: Array<Record<string, any>>, columns: string[]): string {
  const head = columns.map(csvEscape).join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return `﻿${head}\n${body}`; // BOM helps Excel auto-detect UTF-8
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { id } = req.query as { id: string };
  const what = (req.query.what as string) || "standings";

  try {
    if (what === "teams") {
      const teams = await prisma.team.findMany({
        where: { tournamentId: id },
        include: { captain: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      });
      const rows = teams.map((t) => ({
        equipo: t.name,
        capitan: t.captain?.name ?? "",
        email: t.captain?.email ?? "",
        jugadores: t.playersCount,
        pago: t.payStatus,
        cuota: Number(t.payAmount),
      }));
      const csv = toCsv(rows, ["equipo", "capitan", "email", "jugadores", "pago", "cuota"]);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="equipos-${id}.csv"`);
      return res.send(csv);
    }

    if (what === "payments") {
      const payments = await prisma.payment.findMany({
        where: { tournamentId: id },
        include: { team: { select: { name: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      const rows = payments.map((p) => ({
        equipo: p.team?.name ?? "",
        pagador: p.user.name,
        monto: Number(p.amount),
        moneda: p.currency,
        metodo: p.method,
        estado: p.status,
        fecha: p.paidAt ? p.paidAt.toISOString() : p.createdAt.toISOString(),
      }));
      const csv = toCsv(rows, ["equipo", "pagador", "monto", "moneda", "metodo", "estado", "fecha"]);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="pagos-${id}.csv"`);
      return res.send(csv);
    }

    // standings (default)
    const matches = await prisma.bracketMatch.findMany({
      where: {
        round: { tournamentId: id },
        status: "COMPLETED",
        homeTeamId: { not: null },
        awayTeamId: { not: null },
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    });

    type Row = { id: string; name: string; pj: number; g: number; e: number; p: number; gf: number; gc: number; dg: number; pts: number };
    const map = new Map<string, Row>();
    const ensure = (t: { id: string; name: string }) => {
      if (!map.has(t.id)) map.set(t.id, { id: t.id, name: t.name, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
      return map.get(t.id)!;
    };
    for (const m of matches) {
      if (!m.homeTeam || !m.awayTeam) continue;
      const h = ensure(m.homeTeam), a = ensure(m.awayTeam);
      const hs = m.homeScore!, as_ = m.awayScore!;
      h.pj++; a.pj++;
      h.gf += hs; h.gc += as_; a.gf += as_; a.gc += hs;
      if (hs > as_) { h.g++; h.pts += 3; a.p++; }
      else if (as_ > hs) { a.g++; a.pts += 3; h.p++; }
      else { h.e++; a.e++; h.pts++; a.pts++; }
    }
    const rows = Array.from(map.values()).map((r) => ({ ...r, dg: r.gf - r.gc })).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);

    const csv = toCsv(
      rows.map((r, i) => ({ pos: i + 1, equipo: r.name, pj: r.pj, g: r.g, e: r.e, p: r.p, gf: r.gf, gc: r.gc, dg: r.dg, pts: r.pts })),
      ["pos", "equipo", "pj", "g", "e", "p", "gf", "gc", "dg", "pts"]
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="tabla-${id}.csv"`);
    return res.send(csv);
  } catch {
    return res.status(500).end();
  }
}
