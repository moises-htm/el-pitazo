import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export const config = { api: { bodyParser: { sizeLimit: "50mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Public — no auth needed
    const page = parseInt((req.query.page as string) || "1");
    const limit = 10;
    const featured = req.query.featured === "true";
    const tournamentId = (req.query.tournamentId as string) || undefined;

    const where: any = {};
    if (featured) where.isFeatured = true;
    if (tournamentId) where.tournamentId = tournamentId;
    const posts = await prisma.feedPost.findMany({
      where,
      orderBy: featured ? { createdAt: "desc" } : [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Get calling user's likes if authenticated
    const userId = getUserId(req);
    let likedPostIds: string[] = [];
    if (userId && posts.length > 0) {
      const likes = await prisma.feedLike.findMany({
        where: { userId, postId: { in: posts.map(p => p.id) } },
        select: { postId: true },
      });
      likedPostIds = likes.map(l => l.postId);
    }

    return res.json({
      posts: posts.map(p => ({ ...p, likedByMe: likedPostIds.includes(p.id) })),
    });
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { videoUrl, thumbnailUrl, caption, teamId, tournamentId } = req.body as {
      videoUrl?: string;
      thumbnailUrl?: string;
      caption?: string;
      teamId?: string;
      tournamentId?: string;
    };
    if (!videoUrl || typeof videoUrl !== "string") {
      return res.status(400).json({ error: "videoUrl requerida" });
    }
    if (caption && caption.length > 500) {
      return res.status(400).json({ error: "Caption muy largo (máx 500)" });
    }

    // Authorization: a post tagged with teamId requires membership; tagged with
    // tournamentId requires being on a team in that tournament OR being the creator.
    if (teamId) {
      const member = await prisma.teamMember.findFirst({
        where: { teamId, userId },
        select: { id: true },
      });
      if (!member) return res.status(403).json({ error: "No perteneces a ese equipo" });
    }
    if (tournamentId) {
      const [creator, member] = await Promise.all([
        prisma.tournament.findFirst({
          where: { id: tournamentId, creatorId: userId },
          select: { id: true },
        }),
        prisma.teamMember.findFirst({
          where: { userId, team: { tournamentId } },
          select: { id: true },
        }),
      ]);
      if (!creator && !member) {
        return res.status(403).json({ error: "Sin acceso a ese torneo" });
      }
    }

    const post = await prisma.feedPost.create({
      data: { uploaderId: userId, videoUrl, thumbnailUrl, caption, teamId, tournamentId },
      include: { uploader: { select: { id: true, name: true, avatar: true } } },
    });
    return res.json({ post });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
