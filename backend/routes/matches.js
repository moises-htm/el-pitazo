const express = require("express");
const { prisma, authenticate } = require("../middleware/auth");
const router = express.Router();

router.use(authenticate);

router.get("/tournament/:tournamentId", async (req, res) => {
  try {
    const matches = await prisma.bracketMatch.findMany({
      where: {
        round: { tournamentId: req.params.tournamentId },
      },
      include: {
        round: true,
        homeTeam: { select: { name: true, colorHex: true, logo: true } },
        awayTeam: { select: { name: true, colorHex: true, logo: true } },
        referee: { select: { name: true, rating: true } },
        field: { select: { name: true, address: true } },
        events: true,
      },
      orderBy: { scheduledAt: "asc" },
    });
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/score", async (req, res) => {
  try {
    const { homeScore, awayScore } = req.body;
    const match = await prisma.bracketMatch.update({
      where: { id: req.params.id },
      data: {
        homeScore,
        awayScore,
        status: "COMPLETED",
        finishedAt: new Date(),
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });
    // Update tournament analytics
    const tournament = await prisma.tournament.findUnique({ where: { id: match.round.tournamentId } });
    if (tournament) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { totalScoreCount: { increment: 1 } },
      });
    }
    res.json({ match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/event", async (req, res) => {
  try {
    const { eventType, playerId, teamId, minute, extraMin, details } = req.body;
    const match = await prisma.bracketMatch.findUnique({ where: { id: req.params.id } });
    if (!match) return res.status(404).json({ error: "Match not found" });
    const event = await prisma.matchEvent.create({
      data: {
        matchId: req.params.id,
        eventType,
        playerId,
        teamId,
        minute,
        extraMin: extraMin || 0,
        details: details || null,
      },
    });
    // Recount goals for the match
    if (eventType === "goal") {
      const goals = await prisma.matchEvent.count({
        where: { matchId: req.params.id, eventType: "goal" },
      });
      const homeGoals = await prisma.matchEvent.count({
        where: { matchId: req.params.id, eventType: "goal", teamId },
      });
      await prisma.bracketMatch.update({
        where: { id: req.params.id },
        data: { totalScoreCount: { increment: 1 } },
      });
    }
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get standings
router.get("/standings/:tournamentId", async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: req.params.tournamentId }, include: { teams: true } });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const standings = tournament.teams.map((team) => {
      const homeMatches = team.homeMatches.filter((m) => m.status === "COMPLETED");
      const awayMatches = team.awayMatches.filter((m) => m.status === "COMPLETED");
      const allMatches = [...homeMatches, ...awayMatches];
      const wins = allMatches.filter((m) => (m.homeTeamId === team.id && m.homeScore > m.awayScore) || (m.awayTeamId === team.id && m.awayScore > m.homeScore)).length;
      const losses = allMatches.filter((m) => (m.homeTeamId === team.id && m.homeScore < m.awayScore) || (m.awayTeamId === team.id && m.awayScore < m.homeScore)).length;
      const draws = allMatches.filter((m) => m.homeScore === m.awayScore).length;
      const gf = allMatches.reduce((sum, m) => sum + (m.homeTeamId === team.id ? m.homeScore : m.awayScore), 0);
      const ga = allMatches.reduce((sum, m) => sum + (m.homeTeamId === team.id ? m.awayScore : m.homeScore), 0);
      const points = wins * 3 + draws;
      return {
        id: team.id,
        name: team.name,
        logo: team.logo,
        colorHex: team.colorHex,
        played: allMatches.length,
        wins,
        losses,
        draws,
        gf,
        ga,
        gd: gf - ga,
        points,
      };
    });

    standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    res.json({ standings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
