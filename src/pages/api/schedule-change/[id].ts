import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const id = req.query.id as string;
  const { action, note } = req.body as { action: "approve" | "reject"; note?: string };
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ error: "action must be approve or reject" });

  const changeReq = await prisma.scheduleChangeRequest.findUnique({
    where: { id },
    include: {
      match: {
        include: {
          homeTeam: { include: { members: { where: { userId, isCaptain: true } } } },
          awayTeam: { include: { members: { where: { userId, isCaptain: true } } } },
        },
      },
    },
  });
  if (!changeReq) return res.status(404).json({ error: "Solicitud no encontrada" });
  if (changeReq.status !== "PENDING") return res.status(400).json({ error: "Esta solicitud ya fue procesada" });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isOrganizer = user?.role?.includes("ORGANIZER");
  const isReferee = changeReq.match.refereeId === userId;
  const isCaptainB = (changeReq.match.homeTeam?.members?.length ?? 0) > 0 || (changeReq.match.awayTeam?.members?.length ?? 0) > 0;
  // captainB = captain of the OTHER team (not the requestedBy)
  const isOtherCaptain = isCaptainB && userId !== changeReq.requestedById;

  let updateData: Record<string, unknown> = {};

  if (action === "reject") {
    if (isOrganizer) {
      updateData = { status: "REJECTED_BY_ORGANIZER", organizerNote: note };
    } else if (isReferee) {
      updateData = { status: "REJECTED_BY_REFEREE", refereeNote: note };
    } else if (isOtherCaptain) {
      updateData = { status: "REJECTED_BY_CAPTAIN", captainBNote: note };
    } else {
      return res.status(403).json({ error: "No tienes permiso para esta acción" });
    }
  } else {
    // approve
    if (isOtherCaptain && !changeReq.captainBApproved) {
      updateData = { captainBApproved: true, captainBNote: note };
    } else if (isReferee && changeReq.captainBApproved && !changeReq.refereeApproved) {
      updateData = { refereeApproved: true, refereeNote: note };
    } else if (isOrganizer && changeReq.captainBApproved && changeReq.refereeApproved && !changeReq.organizerApproved) {
      updateData = { organizerApproved: true, organizerNote: note, status: "APPROVED" };
    } else {
      return res.status(400).json({ error: "No es tu turno de aprobar o ya aprobaste" });
    }
  }

  // If fully approved, update the match scheduledAt
  const updated = await prisma.scheduleChangeRequest.update({ where: { id }, data: updateData });
  if (updated.status === "APPROVED") {
    await prisma.bracketMatch.update({
      where: { id: changeReq.matchId },
      data: { scheduledAt: changeReq.proposedTime },
    });
  }

  return res.json({ request: updated });
}
