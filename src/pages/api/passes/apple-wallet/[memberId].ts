import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { memberId } = req.query as { memberId: string };

  const hasAppleCerts =
    process.env.APPLE_PASS_CERT &&
    process.env.APPLE_PASS_KEY &&
    process.env.APPLE_WWDR_CERT &&
    process.env.APPLE_PASS_TYPE_IDENTIFIER &&
    process.env.APPLE_TEAM_IDENTIFIER;

  if (!hasAppleCerts) {
    return res.status(501).json({
      error: "Apple Wallet not configured",
      instructions:
        "Set APPLE_WWDR_CERT, APPLE_PASS_CERT, APPLE_PASS_KEY, APPLE_PASS_TYPE_IDENTIFIER, APPLE_TEAM_IDENTIFIER in environment variables. See docs/apple-wallet-setup.md",
    });
  }

  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: {
      user: { select: { name: true, avatar: true } },
      team: { include: { tournament: { select: { name: true } } } },
    },
  });

  if (!member) return res.status(404).json({ error: "Player not found" });

  try {
    const { PKPass } = await import("passkit-generator");
    const baseUrl = process.env.NEXTAUTH_URL || "https://el-pitazo.vercel.app";

    // 1×1 transparent PNG placeholder for icons
    const iconBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    );

    const passJson = {
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
      formatVersion: 1,
      organizationName: "El Pitazo",
      description: `Credencial ${member.user.name}`,
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(17, 24, 39)",
      labelColor: "rgb(156, 163, 175)",
      logoText: "El Pitazo",
      generic: {
        primaryFields: [{ key: "name", label: "JUGADOR", value: member.user.name }],
        secondaryFields: [
          { key: "team", label: "EQUIPO", value: member.team.name },
          { key: "number", label: "NÚMERO", value: `#${member.number}` },
        ],
        auxiliaryFields: [
          { key: "tournament", label: "TORNEO", value: member.team.tournament.name },
          ...(member.position ? [{ key: "position", label: "POSICIÓN", value: member.position }] : []),
        ],
      },
      barcode: {
        format: "PKBarcodeFormatQR",
        message: `${baseUrl}/verify/${member.id}`,
        messageEncoding: "iso-8859-1",
        altText: member.user.name,
      },
    };

    const pass = new PKPass(
      {
        "pass.json": Buffer.from(JSON.stringify(passJson)),
        "icon.png": iconBuffer,
        "icon@2x.png": iconBuffer,
        "logo.png": iconBuffer,
        "logo@2x.png": iconBuffer,
      },
      {
        wwdr: process.env.APPLE_WWDR_CERT!,
        signerCert: process.env.APPLE_PASS_CERT!,
        signerKey: process.env.APPLE_PASS_KEY!,
        signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE,
      }
    );

    const buffer = await pass.getAsBuffer();
    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${member.user.name.replace(/\s+/g, "_")}.pkpass"`
    );
    return res.send(buffer);
  } catch (err: any) {
    console.error("Pass error:", err);
    return res.status(500).json({ error: "Error generando el pase" });
  }
}
