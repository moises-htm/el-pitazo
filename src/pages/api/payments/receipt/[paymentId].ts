// GET /api/payments/receipt/[paymentId] — Digital receipt (printable HTML)
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]!));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const userId = getUserId(req);
  if (!userId) return res.status(401).send("No autorizado");

  const { paymentId } = req.query as { paymentId: string };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      tournament: { select: { name: true, currency: true, fieldLocation: true, creatorId: true } },
      team: { select: { name: true, captainId: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!payment) return res.status(404).send("Recibo no encontrado");

  const isOwner =
    payment.userId === userId ||
    payment.team?.captainId === userId ||
    payment.tournament?.creatorId === userId;
  if (!isOwner) return res.status(403).send("Sin acceso");

  const date = (payment.paidAt ?? payment.createdAt).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
  const amountText = `${Number(payment.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${payment.currency}`;
  const statusText = payment.status === "COMPLETED" ? "PAGADO" : payment.status === "PENDING" ? "PENDIENTE" : payment.status;
  const statusColor = payment.status === "COMPLETED" ? "#10b981" : payment.status === "PENDING" ? "#f59e0b" : "#6b7280";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Recibo ${payment.id.slice(0, 8)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f5f5f5; margin: 0; padding: 2rem 1rem; }
    .receipt { max-width: 480px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    h1 { margin: 0 0 .25rem; font-size: 1.5rem; letter-spacing: .04em; }
    .brand { color: #10b981; font-weight: 800; }
    .subtitle { color: #6b7280; font-size: .85rem; margin: 0 0 1.5rem; }
    .row { display: flex; justify-content: space-between; padding: .75rem 0; border-top: 1px solid #f3f4f6; }
    .row:first-of-type { border-top: 0; }
    .label { color: #6b7280; font-size: .85rem; }
    .value { color: #111827; font-weight: 600; text-align: right; }
    .total { margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .total .amount { font-size: 1.5rem; font-weight: 800; color: #047857; }
    .status { display: inline-block; padding: .35rem .75rem; border-radius: 999px; font-size: .75rem; font-weight: 700; letter-spacing: .05em; color: white; }
    .footer { margin-top: 2rem; text-align: center; color: #9ca3af; font-size: .75rem; }
    .actions { margin-top: 1.5rem; text-align: center; }
    button { background: #10b981; color: white; border: 0; padding: .65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: .9rem; }
    button:hover { background: #059669; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; padding: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <h1 class="brand">⚽ El Pitazo</h1>
    <p class="subtitle">Recibo digital · ${escape(payment.id)}</p>

    <div class="row"><span class="label">Estado</span><span class="value"><span class="status" style="background:${statusColor}">${statusText}</span></span></div>
    <div class="row"><span class="label">Fecha</span><span class="value">${escape(date)}</span></div>
    <div class="row"><span class="label">Pagador</span><span class="value">${escape(payment.user.name)}</span></div>
    ${payment.team ? `<div class="row"><span class="label">Equipo</span><span class="value">${escape(payment.team.name)}</span></div>` : ""}
    ${payment.tournament ? `<div class="row"><span class="label">Torneo</span><span class="value">${escape(payment.tournament.name)}</span></div>` : ""}
    <div class="row"><span class="label">Método</span><span class="value">${escape(payment.method)}</span></div>
    ${payment.externalId ? `<div class="row"><span class="label">Referencia</span><span class="value" style="font-family:monospace;font-size:.8rem">${escape(payment.externalId)}</span></div>` : ""}

    <div class="total">
      <span class="label" style="color:#047857;font-weight:700">Total pagado</span>
      <span class="amount">${escape(amountText)}</span>
    </div>

    <div class="actions">
      <button onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>

    <p class="footer">Conserva este recibo · El Pitazo · elpitazo.app</p>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
