import { useEffect, useState, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface MatchTimerProps {
  startedAt?: string | null;
  status: string;
  /** Half duration in seconds (default 45 min). */
  halfSeconds?: number;
  /** Optional callback after halftime is reached. */
  onHalfReached?: () => void;
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MatchTimer({ startedAt, status, halfSeconds = 45 * 60, onHalfReached }: MatchTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(status === "IN_PROGRESS");
  const baseRef = useRef<number>(0);
  const tickedHalfRef = useRef(false);

  useEffect(() => {
    if (startedAt) {
      const start = new Date(startedAt).getTime();
      baseRef.current = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(baseRef.current);
    } else {
      baseRef.current = 0;
      setElapsed(0);
    }
    setRunning(status === "IN_PROGRESS");
    tickedHalfRef.current = false;
  }, [startedAt, status]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (!tickedHalfRef.current && next >= halfSeconds) {
          tickedHalfRef.current = true;
          onHalfReached?.();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, halfSeconds, onHalfReached]);

  const pastHalf = elapsed > halfSeconds;
  const minute = Math.floor(elapsed / 60);
  const inExtra = pastHalf ? minute - Math.floor(halfSeconds / 60) : 0;

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
      <div className="flex-1">
        <div className="font-display font-black text-4xl text-white tabular-nums">
          {format(elapsed)}
          {inExtra > 0 && <span className="text-yellow-400 text-2xl ml-2">+{inExtra}'</span>}
        </div>
        <div className="text-xs text-gray-500 font-display uppercase tracking-wide">
          {status === "IN_PROGRESS" ? "En juego" : status === "COMPLETED" ? "Finalizado" : "Pausado"}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`w-11 h-11 rounded-full flex items-center justify-center ${
            running ? "bg-yellow-500 text-black" : "bg-green-500 text-black"
          }`}
          title={running ? "Pausar" : "Reanudar"}
          aria-label="toggle timer"
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={() => { setElapsed(0); tickedHalfRef.current = false; }}
          className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-gray-400 flex items-center justify-center"
          title="Reiniciar"
          aria-label="reset"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
