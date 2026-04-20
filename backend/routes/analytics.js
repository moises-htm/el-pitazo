const express = require("express");
const { prisma, authenticate } = require("../middleware/auth");
const router = express.Router();

router.use(authenticate);

// Get tournament analytics
router.get("/tournament/:tournamentId", async (req, res) => {
  try {
    const analytics = await prisma.tournamentAnalytics.findMany({
      where: { tournamentId: req.params.tournamentId },
      orderBy: { date: "desc" },
    });

    const stats = await Promise.all([
      prisma.team.count({ where: { tournamentId: req.params.tournamentId } }),
      prisma.payment.aggregate({
        where: { tournamentId: req.params.tournamentId, status: "COMPLETED" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.bracketMatch.count({
        where: {
          round: { tournamentId: req.params.tournamentId },
          status: "COMPLETED",
        },
      }),
      prisma.tournamentMedia.count({
        where: { tournamentId: req.params.tournamentId },
      }),
    ]);

    res.json({
      analytics,
      teams: stats[0],
      totalRevenue: stats[1]._sum.amount || 0,
      totalPayments: stats[1]._count.id,
      matchesCompleted: stats[2],
      mediaCount: stats[3],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create analytics record
router.post("/record", async (req, res) => {
  try {
    const { tournamentId, date, visitors, pageViews, regCount, payCount, payTotal, socialShares } = req.body;
    const record = await prisma.tournamentAnalytics.create({
      data: {
        tournamentId,
        date: date ? new Date(date) : new Date(),
        visitors: visitors || 0,
        pageViews: pageViews || 0,
        regCount: regCount || 0,
        payCount: payCount || 0,
        payTotal: payTotal || 0,
        socialShares: socialShares || 0,
      },
    });
    res.json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
