import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";

export default function OAuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    if (session?.pitazoToken) {
      setToken(session.pitazoToken as string);
      setUser(session.user as any);
      router.replace("/dashboard");
    }
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Iniciando sesión...</p>
      </div>
    </div>
  );
}
