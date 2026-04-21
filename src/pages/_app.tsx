import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { useAuthStore } from "@/lib/auth";
import { SplashScreen } from "@/components/splash-screen";

export default function App({ Component, pageProps: { session, ...pageProps } }: { Component: any; pageProps: any }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("splash-seen");
      if (!seen) {
        setShowSplash(true);
        sessionStorage.setItem("splash-seen", "1");
      }
    }
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    // Capture install prompt
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
      <Component {...pageProps} />
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-white/10 flex items-center justify-between gap-3 md:max-w-md md:mx-auto md:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-72.png" alt="" className="w-10 h-10 rounded-xl" />
            <div>
              <p className="text-white font-semibold text-sm">Instalar El Pitazo</p>
              <p className="text-gray-400 text-xs">Acceso rápido desde tu pantalla de inicio</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstallBanner(false)} className="text-gray-400 text-sm px-3 py-1.5">No ahora</button>
            <button onClick={installApp} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg font-semibold transition-all">Instalar</button>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}
