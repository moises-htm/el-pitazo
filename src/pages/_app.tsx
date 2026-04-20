import "@/styles/globals.css";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <Component {...pageProps} />
    </>
  );
}
