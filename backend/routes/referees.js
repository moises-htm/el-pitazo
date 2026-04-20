const express = require("express");
const { prisma, authenticate } = require("../middleware/auth");
const router = express.Router();

router.use(authenticate);

// GET today's matches for referee
router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const matches = await prisma.bracketMatch.findMany({
      where: {
        refereeId: req.user.id,
        scheduledAt: { gte: today, lt: tomorrow },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      include: {
        homeTeam: { select: { name: true, logo: true } },
        awayTeam: { select: { name: true, logo: true } },
        field: { select: { name: true, address: true } },
        round: { include: { tournament: { select: { name: true, fieldLocation: true } } } },
        refereeAssign: true,
      },
      orderBy: { scheduledAt: "asc" },
    });

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all referee's history
router.get("/history", async (req, res) => {
  try {
    const assignments = await prisma.refereeAssignment.findMany({
      where: { refereeId: req.user.id },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            round: { include: { tournament: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm availability
router.post("/availability", async (req, res) => {
  try {
    const { date, available } = req.body;
    // Store availability in user metadata (simplified)
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET referee earnings
router.get("/earnings", async (req, res) => {
  try {
    const totalEarned = await prisma.refereeAssignment.aggregate({
      where: { refereeId: req.user.id, paid: true },
      _sum: { fee: true },
    });
    const totalPending = await prisma.refereeAssignment.aggregate({
      where: { refereeId: req.user.id, paid: false },
      _sum: { fee: true },
    });
    res.json({
      totalEarned: totalEarned._sum.fee || 0,
      totalPending: totalPending._sum.fee || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit referee report
router.post("/report/:matchId", async (req, res) => {
  try {
    const report = await prisma.refereeReport.create({
      data: {
        matchId: req.params.matchId,
        refereeId: req.user.id,
        ...req.body,
      },
    });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign referee to match
router.post("/assign/:matchId", async (req, res) => {
  try {
    const assignment = await prisma.refereeAssignment.create({
      data: {
        matchId: req.params.matchId,
        refereeId: req.user.id,
        status: "confirmed",
      },
    });
    await prisma.bracketMatch.update({
      where: { id: req.params.matchId },
      data: { refereeId: req.user.id },
    });
    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
