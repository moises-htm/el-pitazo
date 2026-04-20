const express = require("express");
const { prisma, authenticate } = require("../middleware/auth");
const { z } = require("zod");
const router = express.Router();

router.use(authenticate);

const teamSchema = z.object({
  name: z.string().min(1),
  captainId: z.string().optional(),
  logo: z.string().optional(),
  colorHex: z.string().optional(),
  skillLevel: z.number().int().min(1).max(5).optional(),
  payAmount: z.number().positive(),
});

router.post("/", async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: req.body.tournamentId } });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });
    const teamsCount = await prisma.team.count({ where: { tournamentId: req.body.tournamentId } });
    if (tournament.maxTeams && teamsCount >= tournament.maxTeams) {
      return res.status(400).json({ error: "Tournament full" });
    }
    const data = teamSchema.parse(req.body);
    const team = await prisma.team.create({
      data: {
        ...data,
        tournamentId: req.body.tournamentId,
        payAmount: parseFloat(data.payAmount),
        playersCount: 0,
      },
      include: { captain: { select: { name: true } } },
    });
    res.json({ team });
  } catch (err) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

router.get("/tournament/:tournamentId", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: { tournamentId: req.params.tournamentId },
      include: {
        captain: { select: { name: true, phone: true } },
        members: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { name: "asc" },
    });
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.team.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add player to team
router.post("/:id/members", async (req, res) => {
  try {
    const { userId, number, position } = req.body;
    const member = await prisma.teamMember.create({
      data: { teamId: req.params.id, userId, number, position, isCaptain: false },
    });
    await prisma.team.update({
      where: { id: req.params.id },
      data: { playersCount: { increment: 1 } },
    });
    res.json({ member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
