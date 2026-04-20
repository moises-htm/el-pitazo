const express = require("express");
const { prisma, authenticate } = require("../middleware/auth");
const router = express.Router();

router.use(authenticate);

// Upload media (placeholder — will connect to S3)
router.post("/upload", async (req, res) => {
  try {
    const { tournamentId, matchId, type, caption } = req.body;
    const media = await prisma.tournamentMedia.create({
      data: {
        tournamentId,
        matchId,
        uploaderId: req.user.id,
        type,
        caption,
        url: "https://placeholder.url/media.jpg", // will be S3 URL
      },
    });
    res.json({ media });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get media for tournament
router.get("/tournament/:tournamentId", async (req, res) => {
  try {
    const media = await prisma.tournamentMedia.findMany({
      where: { tournamentId: req.params.tournamentId },
      include: {
        uploader: { select: { name: true } },
        match: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ media });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
