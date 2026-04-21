import "@/styles/globals.css";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { useAuthStore } from "@/lib/auth";

export default function App({ Component, pageProps: { session, ...pageProps } }: { Component: any; pageProps: any }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SessionProvider session={session}>
      <Toaster position="top-center" theme="dark" />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
