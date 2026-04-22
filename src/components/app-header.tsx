import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { useRouter } from "next/router";

export function AppHeader() {
  const { user } = useAuthStore();
  const router = useRouter();
  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="font-display font-black uppercase tracking-widest text-white text-base">El Pitazo</span>
        </Link>
        <button
          onClick={() => router.push("/settings/notifications")}
          className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold text-sm transition-all hover:bg-green-500/30"
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
