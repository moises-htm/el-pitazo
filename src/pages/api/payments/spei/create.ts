import { logger } from "@/lib/logger";
import type { NextApiRequest, NextApiResponse } from "next";
import MercadoPagoConfig, { Payment as MPPayment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { withTimeout } from "@/lib/with-timeout";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_SECRET_KEY! });
const mpPayment = new MPPayment(mpClient);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const { tournamentId, teamId } = req.body;
  if (!tournamentId || !teamId) return res.status(400).json({ error: "tournamentId y teamId son requeridos" });

  try {
    const [tournament, team, user] = await Promise.all([
      prisma.tournament.findUnique({ where: { id: tournamentId }, select: { name: true, regFee: true } }),
      prisma.team.findUnique({ where: { id: teamId }, select: { name: true, captainId: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    ]);

    if (!tournament || !team) return res.status(404).json({ error: "Torneo o equipo no encontrado" });
    if (team.captainId !== userId) return res.status(403).json({ error: "Solo el capitán puede pagar la inscripción" });
    if (!user?.email) return res.status(400).json({ error: "Se requiere correo electrónico para transferencia SPEI" });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://elpitazo.app";

    // Phase 1: Create payment in MercadoPago
    let result: Awaited<ReturnType<typeof mpPayment.create>>;
    try {
      result = await withTimeout(mpPayment.create({
        body: {
          transaction_amount: Number(tournament.regFee),
          description: `Inscripción ${tournament.name} — Equipo: ${team.name}`,
          payment_method_id: "bank_transfer",
          payer: { email: user.email },
          external_reference: `${tournamentId}:${teamId}:${userId}`,
          notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
        },
      }), 10_000, "mp-spei");
    } catch (mpErr) {
      logger.error("SPEI MP API error:", mpErr);
      return res.status(502).json({ error: "Error al conectar con MercadoPago. Intenta de nuevo." });
    }

    const txDetails = result.transaction_details as any;
    const clabe = txDetails?.financial_institution ?? txDetails?.external_resource_url ?? null;
    const reference = txDetails?.acquirer_reference_number ?? String(result.id);

    // Phase 2: Persist to DB — log orphan if this fails so we can reconcile
    let payment;
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
          externalId: String(result.id),
        },
      });
    } catch (dbErr) {
      logger.error(`ORPHANED SPEI PAYMENT: mpId=${result.id} team=${teamId}`, dbErr);
      return res.status(500).json({ error: "Referencia generada en MercadoPago pero no registrada. Contacta soporte con tu ID: " + result.id });
    }

    return res.json({
      paymentId: payment.id,
      mpPaymentId: result.id,
      clabe,
      reference,
      amount: Number(tournament.regFee),
      expiresAt: (result as any).date_of_expiration ?? null,
    });
  } catch (err) {
    logger.error("SPEI create error:", err);
    return res.status(500).json({ error: "Error al generar referencia SPEI" });
  }
}
