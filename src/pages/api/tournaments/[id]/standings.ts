import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query as { id: string };

  try {
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
        homeTeam: { select: { id: true, name: true, logo: true, colorHex: true } },
        awayTeam: { select: { id: true, name: true, logo: true, colorHex: true } },
      },
    });

    type TeamRow = {
      teamId: string;
      name: string;
      logo: string | null;
      colorHex: string | null;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    };

    const teamMap = new Map<string, TeamRow>();

    const ensure = (team: { id: string; name: string; logo: string | null; colorHex: string | null }) => {
      if (!teamMap.has(team.id)) {
        teamMap.set(team.id, {
          teamId: team.id, name: team.name, logo: team.logo, colorHex: team.colorHex,
          played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
        });
      }
      return teamMap.get(team.id)!;
    };

    for (const m of matches) {
      if (!m.homeTeam || !m.awayTeam) continue;
      const home = ensure(m.homeTeam);
      const away = ensure(m.awayTeam);
      const hs = m.homeScore!;
      const as_ = m.awayScore!;

      home.played++;
      away.played++;
      home.goalsFor += hs;
      home.goalsAgainst += as_;
      away.goalsFor += as_;
      away.goalsAgainst += hs;

      if (hs > as_) {
        home.won++; home.points += 3; away.lost++;
      } else if (as_ > hs) {
        away.won++; away.points += 3; home.lost++;
      } else {
        home.drawn++; home.points++;
        away.drawn++; away.points++;
      }
    }

    const standings = Array.from(teamMap.values())
      .map((t) => ({ ...t, goalDiff: t.goalsFor - t.goalsAgainst }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      })
      .map((t, i) => ({ ...t, position: i + 1 }));

    return res.json({ standings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo calcular la tabla" });
  }
}
