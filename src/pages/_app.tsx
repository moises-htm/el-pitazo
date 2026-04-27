import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { useAuthStore } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { SplashScreen } from "@/components/splash-screen";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { useRouter } from "next/router";

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/oauth-callback"];
const PUBLIC_ROUTES = ["/", ...AUTH_ROUTES];

export default function App({ Component, pageProps: { session, ...pageProps } }: { Component: any; pageProps: any }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useTheme((s) => s.hydrate);
  const { user } = useAuthStore();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const router = useRouter();

  const isAuthRoute = AUTH_ROUTES.includes(router.pathname);
  const isLanding = router.pathname === "/";
  const showChrome = !!user && !isAuthRoute && !isLanding;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("splash-seen");
      if (!seen) {
        setShowSplash(true);
        sessionStorage.setItem("splash-seen", "1");
      }
    }
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstallBanner(false);
  }

  return (
    <SessionProvider session={session}>
      <Toaster position="top-center" theme="dark" />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {showChrome && <AppHeader />}
      <Component {...pageProps} />
      {showChrome && <BottomNav />}
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 z-50 p-4 backdrop-blur-xl bg-gray-900/90 border border-white/10 rounded-2xl flex items-center justify-between gap-3 md:max-w-md md:mx-auto shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-72.png" alt="" className="w-10 h-10 rounded-xl" />
            <div>
              <p className="text-white font-semibold text-sm">Instalar El Pitazo</p>
              <p className="text-gray-400 text-xs">Acceso rápido desde tu pantalla de inicio</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstallBanner(false)} className="text-gray-400 text-sm px-3 py-1.5 transition-colors hover:text-white">No ahora</button>
            <button onClick={installApp} className="bg-green-500 hover:bg-green-400 text-black text-sm px-4 py-1.5 rounded-lg font-bold transition-all active:scale-95">Instalar</button>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}
