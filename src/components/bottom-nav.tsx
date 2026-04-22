import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Trophy, Rss, MessageCircle, User } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/dashboard", icon: Trophy, label: "Torneos" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/settings/notifications", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const { pathname } = useRouter();

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div className="h-20" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-gray-900/90 border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
                  active
                    ? "text-green-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon
                  size={22}
                  className={active ? "drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]" : ""}
                />
                <span className={`text-[10px] font-display uppercase tracking-wide ${active ? "text-green-400" : "text-gray-500"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
