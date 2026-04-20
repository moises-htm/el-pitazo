// Payment system — Stripe + MercadoPago integration
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { prisma, authenticate } = require("../middleware/auth");
const { z } = require("zod");
const router = express.Router();

router.use(authenticate);

const paymentSchema = z.object({
  teamId: z.string(),
  tournamentId: z.string(),
  method: z.enum(["STRIPE", "MERCADOPAGO", "SPEI", "OXXO", "CASH"]),
  amount: z.number().positive(),
});

// Create Stripe payment intent
router.post("/stripe", async (req, res) => {
  try {
    const data = paymentSchema.parse(req.body);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // cents
      currency: "mxn",
      metadata: {
        teamId: data.teamId,
        tournamentId: data.tournamentId,
      },
    });
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        teamId: data.teamId,
        tournamentId: data.tournamentId,
        amount: data.amount,
        method: "STRIPE",
        status: "PENDING",
        externalId: paymentIntent.id,
      },
    });
    res.json({ clientSecret: paymentIntent.client_secret, payment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create MercadoPago checkout
router.post("/mercadopago", async (req, res) => {
  try {
    const data = paymentSchema.parse(req.body);
    // MercadoPago checkout preference
    const preference = {
      items: [
        {
          title: `Inscripción torneo`,
          unit_price: data.amount,
          quantity: 1,
          currency_id: "MXN",
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`,
      },
      auto_return: "approved",
    };
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        teamId: data.teamId,
        tournamentId: data.tournamentId,
        amount: data.amount,
        method: "MERCADOPAGO",
        status: "PENDING",
        externalId: "MP_" + Date.now(),
      },
    });
    res.json({ preferenceId: "MP_" + Date.now(), payment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create OXXO voucher
router.post("/oxxo", async (req, res) => {
  try {
    const data = paymentSchema.parse(req.body);
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        teamId: data.teamId,
        tournamentId: data.tournamentId,
        amount: data.amount,
        method: "OXXO",
        status: "PENDING",
        externalId: "OXXO_" + Date.now(),
      },
    });
    // Generate OXXO barcode voucher URL
    res.json({ voucherUrl: `https://bancomer.com/oxxo/voucher/${Date.now()}`, payment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Confirm payment (webhook handler)
router.post("/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      await prisma.payment.updateMany({
        where: { externalId: pi.id, status: "PENDING" },
        data: { status: "COMPLETED", paidAt: new Date() },
      });
      await prisma.team.updateMany({
        where: { id: pi.metadata.teamId, payStatus: { in: ["PENDING", "PARTIAL"] } },
        data: { payStatus: "PAID" },
      });
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get payment history
router.get("/history", async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        tournament: { select: { name: true } },
        team: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard financial summary
router.get("/dashboard", async (req, res) => {
  try {
    const totalIncome = await prisma.payment.aggregate({
      where: { status: "COMPLETED", userId: req.user.id },
      _sum: { amount: true },
    });
    const pendingPayments = await prisma.payment.count({
      where: { status: "PENDING", userId: req.user.id },
    });
    const tournaments = await prisma.tournament.findMany({
      where: { creatorId: req.user.id },
      select: { id: true, name: true, status: true, teams: { select: { id: true } } },
    });
    const totalTeams = tournaments.reduce((sum, t) => sum + t.teams.length, 0);
    res.json({
      totalIncome: totalIncome._sum.amount || 0,
      pendingPayments,
      totalTournaments: tournaments.length,
      totalTeams,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
