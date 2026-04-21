import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 1600);
    const t3 = setTimeout(onComplete, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-pitch"
      style={{
        transition: "opacity 0.4s ease",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      <div
        style={{
          transform: phase === "in" ? "scale(0.85)" : "scale(1)",
          opacity: phase === "in" ? 0 : 1,
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
        }}
        className="flex flex-col items-center gap-4"
      >
        {/* Logo */}
        <div className="relative">
          <div
            className="text-8xl"
            style={{
              filter: phase !== "in" ? "drop-shadow(0 0 20px rgba(57,255,20,0.6))" : "none",
              transition: "filter 0.5s ease",
            }}
          >
            ⚽
          </div>
        </div>

        <div className="text-center">
          <h1
            className="font-display font-black text-6xl uppercase tracking-widest text-white"
            style={{
              textShadow: phase !== "in" ? "0 0 30px rgba(57,255,20,0.3)" : "none",
            }}
          >
            EL PITAZO
          </h1>
          <div
            className="h-1 rounded-full mt-2 mx-auto"
            style={{
              backgroundColor: '#39FF14',
              width: phase === "hold" || phase === "out" ? "100%" : "0%",
              transition: "width 0.8s ease",
              boxShadow: '0 0 8px #39FF14',
            }}
          />
          <p className="font-display text-sm uppercase tracking-[0.3em] text-gray-500 mt-3">
            Juega. Compite. Gana.
          </p>
        </div>
      </div>
    </div>
  );
}
