import "next-auth";

declare module "next-auth" {
  interface Session {
    pitazoToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string[];
      country?: string;
      lang?: string;
    };
  }
}
