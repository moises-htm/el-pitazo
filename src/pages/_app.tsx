import "@/styles/globals.css";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/lib/auth";

export default function App({ Component, pageProps }: { Component: any; pageProps: any }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <Component {...pageProps} />
    </>
  );
}
