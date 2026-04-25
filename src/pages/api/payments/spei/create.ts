import type { NextApiRequest, NextApiResponse } from "next";
import MercadoPagoConfig, { Payment as MPPayment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { logger } from "@/lib/logger";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_SECRET_KEY! });
const mpPayment = new MPPayment(mpClient);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const { tournamentId, teamId } = req.body;
  if (!tournamentId || !teamId) return res.status(400).json({ error: "tournamentId y teamId son requeridos" });

  const [tournament, team, user] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: tournamentId }, select: { name: true, regFee: true } }),
    prisma.team.findUnique({ where: { id: teamId }, select: { name: true, captainId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
  ]);

  if (!tournament || !team) return res.status(404).json({ error: "Torneo o equipo no encontrado" });
  if (team.captainId !== userId) return res.status(403).json({ error: "Solo el capitán puede pagar la inscripción" });
  if (!user?.email) return res.status(400).json({ error: "Se requiere correo electrónico para transferencia SPEI" });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://elpitazo.app";

  // Step 1: Create payment with MercadoPago
  let mpResult: Awaited<ReturnType<typeof mpPayment.create>>;
  try {
    mpResult = await mpPayment.create({
      body: {
        transaction_amount: Number(tournament.regFee),
        description: `Inscripción ${tournament.name} — Equipo: ${team.name}`,
        payment_method_id: "bank_transfer",
        payer: { email: user.email },
        external_reference: `${tournamentId}:${teamId}:${userId}`,
        notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
      },
    });
  } catch (err) {
    logger.error("SPEI MP create error", { tournamentId, teamId, userId, err: String(err) });
    return res.status(500).json({ error: "Error al generar referencia SPEI" });
  }

  const txDetails = (mpResult.transaction_details as unknown) as Record<string, unknown>;
  const clabe = txDetails?.financial_institution ?? txDetails?.external_resource_url ?? null;
  const reference = txDetails?.acquirer_reference_number ?? String(mpResult.id);

  // Step 2: Persist to DB — if this fails, log the orphaned MP payment so it can be reconciled
  let payment: Awaited<ReturnType<typeof prisma.payment.create>>;
  try {
    payment = await prisma.payment.create({
      data: {
        tournamentId,
        teamId,
        userId,
        amount: tournament.regFee,
        currency: "MXN",
        method: "SPEI",
        status: "PENDING",
        externalId: String(mpResult.id),
      },
    });
  } catch (dbErr) {
    logger.error("SPEI DB insert failed — orphaned MP payment", {
      mpPaymentId: mpResult.id,
      tournamentId,
      teamId,
      userId,
      err: String(dbErr),
    });
    return res.status(500).json({ error: "Error al registrar el pago" });
  }

  return res.json({
    paymentId: payment.id,
    mpPaymentId: mpResult.id,
    clabe,
    reference,
    amount: Number(tournament.regFee),
    expiresAt: ((mpResult as unknown) as Record<string, unknown>).date_of_expiration ?? null,
  });
}
