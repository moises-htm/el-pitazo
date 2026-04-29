import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/server-auth";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      const pitazoToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      return {
        ...session,
        pitazoToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: (user as any).image || (user as any).avatar,
          role: (user as any).role || [],
          country: (user as any).country || "MX",
          lang: (user as any).lang || "es",
        },
      };
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: ["PLAYER"], country: "MX", lang: "es" },
      }).catch(() => {});
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "el-pitazo-nextauth-dev-secret",
};

export default NextAuth(authOptions);
