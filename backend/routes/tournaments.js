const express = require("express");
const { prisma, authenticate } = require("../middleware/auth");
const { z } = require("zod");
const router = express.Router();

router.use(authenticate);

const tournamentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["LEAGUE", "KNOCKOUT", "GROUPS", "SWISS"]),
  maxTeams: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  fieldLocation: z.string().optional(),
  fieldAddress: z.string().optional(),
  fieldLat: z.number().optional(),
  fieldLng: z.number().optional(),
  rules: z.any().optional(),
  regFee: z.number().positive(),
  currency: z.string().default("MXN"),
  isPublic: z.boolean().default(true),
  minSkill: z.number().optional(),
  maxSkill: z.number().optional(),
});

// CREATE tournament
router.post("/", async (req, res) => {
  try {
    const data = tournamentSchema.parse(req.body);
    const tournament = await prisma.tournament.create({
      data: {
        ...data,
        creatorId: req.user.id,
        regFee: parseFloat(data.regFee),
      },
    });
    res.json({ tournament });
  } catch (err) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

// LIST tournaments
router.get("/", async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const where = { status: status || "ACTIVE" };
    if (type) where.type = type;
    if (req.query.search) where.name = { contains: req.query.search, mode: "insensitive" };
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { startDate: "desc" },
        include: { creator: { select: { name: true } } },
      }),
      prisma.tournament.count({ where }),
    ]);
    res.json({ tournaments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tournament detail
router.get("/:id", async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { name: true } },
        teams: { include: { members: { select: { user: { select: { name: true } } } } } },
        bracketRounds: {
          include: {
            matches: {
              include: {
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
                referee: { select: { name: true } },
              },
            },
          },
        },
        fields: true,
      },
    });
    if (!tournament) return res.status(404).json({ error: "Not found" });
    res.json({ tournament });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE tournament
router.put("/:id", async (req, res) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ tournament });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE tournament
router.delete("/:id", async (req, res) => {
  try {
    await prisma.tournament.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GENERATE bracket
router.post("/:id/generate-bracket", async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { teams: true, bracketRounds: true },
    });
    if (!tournament || tournament.teams.length < 2) {
      return res.status(400).json({ error: "Need at least 2 teams" });
    }

    // Generate rounds
    let rounds = [];
    if (tournament.type === "LEAGUE" || tournament.type === "SWISS") {
      rounds = [{ roundNum: 1, bracketType: tournament.type }];
    } else if (tournament.type === "KNOCKOUT") {
      const numRounds = Math.ceil(Math.log2(tournament.teams.length));
      for (let i = 1; i <= numRounds; i++) {
        rounds.push({ roundNum: i, bracketType: "KNOCKOUT" });
      }
    } else if (tournament.type === "GROUPS") {
      rounds.push({ roundNum: 1, bracketType: "GROUPS" });
      rounds.push({ roundNum: 2, bracketType: "KNOCKOUT" });
    }

    const createdRounds = await prisma.$transaction(
      rounds.map((r) =>
        prisma.bracketRound.create({
          data: { tournamentId: tournament.id, roundNum: r.roundNum, bracketType: r.bracketType },
        })
      )
    );

    // Generate matches based on type
    let matches = [];
    if (tournament.type === "LEAGUE" || tournament.type === "SWISS") {
      const teams = tournament.teams.sort(() => Math.random() - 0.5);
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            roundId: createdRounds[0].id,
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            status: "SCHEDULED",
            scheduledAt: tournament.startDate
              ? new Date(new Date(tournament.startDate).getTime() + (matches.length * 2 * 60 * 60 * 1000))
              : undefined,
          });
        }
      }
    } else if (tournament.type === "KNOCKOUT") {
      const teams = tournament.teams.sort(() => Math.random() - 0.5);
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({
            roundId: createdRounds[0].id,
            homeTeamId: teams[i].id,
            awayTeamId: teams[i + 1].id,
            status: "SCHEDULED",
            scheduledAt: tournament.startDate
              ? new Date(new Date(tournament.startDate).getTime() + (matches.length * 2 * 60 * 60 * 1000))
              : undefined,
          });
        } else {
          matches.push({
            roundId: createdRounds[0].id,
            homeTeamId: teams[i].id,
            status: "SCHEDULED",
            bye: true,
          });
        }
      }
    }

    if (matches.length > 0) {
      await prisma.bracketMatch.createMany({ data: matches });
    }

    await prisma.tournament.update({ where: { id: tournament.id }, data: { status: "ACTIVE" } });

    res.json({ tournament: { ...tournament, status: "ACTIVE" }, rounds: createdRounds, matchCount: matches.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
