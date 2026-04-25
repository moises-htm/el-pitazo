import type { NextApiRequest, NextApiResponse } from "next";
import MercadoPagoConfig, { Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { withTimeout } from "@/lib/with-timeout";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_SECRET_KEY! });
const mpPreference = new Preference(mpClient);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const { tournamentId, teamId } = req.body;
  if (!tournamentId || !teamId) return res.status(400).json({ error: "tournamentId y teamId son requeridos" });

  try {
    const [tournament, team, user] = await Promise.all([
      prisma.tournament.findUnique({ where: { id: tournamentId }, select: { name: true, regFee: true, currency: true } }),
      prisma.team.findUnique({ where: { id: teamId }, select: { name: true, captainId: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    ]);

    if (!tournament || !team) return res.status(404).json({ error: "Torneo o equipo no encontrado" });
    if (team.captainId !== userId) return res.status(403).json({ error: "Solo el capitán puede pagar la inscripción" });

    const amount = Number(tournament.regFee);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://elpitazo.app";
    const externalRef = `${tournamentId}:${teamId}:${userId}`;

    const result = await withTimeout(mpPreference.create({
      body: {
        items: [
          {
            id: `${tournamentId}-${teamId}`,
            title: `Inscripción: ${tournament.name}`,
            description: `Equipo: ${team.name}`,
            quantity: 1,
            currency_id: "MXN",
            unit_price: amount,
          },
        ],
        payer: user?.email ? { email: user.email, name: user.name ?? undefined } : undefined,
        back_urls: {
          success: `${baseUrl}/dashboard/player?tab=my&payment=success`,
          failure: `${baseUrl}/dashboard/player?tab=my&payment=failed`,
          pending: `${baseUrl}/dashboard/player?tab=my&payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
        external_reference: externalRef,
        metadata: { tournamentId, teamId, userId },
      },
    }), 10_000, "mp-preference");

    const payment = await prisma.payment.create({
      data: {
        tournamentId,
        teamId,
        userId,
        amount: tournament.regFee,
        currency: "MXN",
        method: "MERCADOPAGO",
        status: "PENDING",
        externalId: result.id,
      },
    });

    return res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
      paymentId: payment.id,
    });
  } catch (err: any) {
    const isTimeout = err?.message?.includes("timed out");
    const detail = process.env.NODE_ENV !== "production" ? err?.message : undefined;
    console.error("MP create-preference error:", { message: err?.message, tournamentId, teamId });
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? "MercadoPago tardó demasiado. Intenta de nuevo en unos segundos."
        : "Error al conectar con MercadoPago. Intenta de nuevo o usa otro método de pago.",
      detail,
    });
  }
}
