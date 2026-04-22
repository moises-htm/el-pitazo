import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { CheckCircle, XCircle, Camera, ChevronLeft, Loader2, Shield } from "lucide-react";

interface VerifyResult {
  eligible: boolean;
  error?: string;
  member?: {
    id: string;
    number: number;
    position: string | null;
    user: { name: string; avatar: string | null };
    team: { name: string; colorHex: string | null };
    tournament: { name: string; status: string };
  };
}

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerReady, setScannerReady] = useState(false);

  async function verify(memberId: string) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/verify/${memberId}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ eligible: false, error: "No se pudo verificar. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  async function startScanner() {
    setError("");
    setResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = "qr-reader-container";
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // Stop scanning immediately
          await html5QrCode.stop();
          setScanning(false);
          // The QR contains the memberId (UUID or URL ending in memberId)
          const memberId = decodedText.includes("/")
            ? decodedText.split("/").pop() ?? decodedText
            : decodedText;
          await verify(memberId);
        },
        () => { /* ignore decode errors */ }
      );
      setScannerReady(true);
    } catch (err: any) {
      setScanning(false);
      setError(err?.message?.includes("permission")
        ? "Permiso de cámara denegado. Habilítalo en la configuración de tu navegador."
        : "No se pudo iniciar la cámara.");
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setScannerReady(false);
  }

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const memberColor = result?.member?.team?.colorHex ?? "#22c55e";

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => { stopScanner(); router.back(); }} className="text-gray-400 hover:text-white">
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-green-400" />
          <span className="text-white font-semibold">Escanear Credencial</span>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
        {/* Scanner area */}
        {!result && (
          <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
            {!scanning ? (
              <div className="p-8 text-center">
                <Camera size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-sm mb-6">
                  Apunta la cámara al código QR de la credencial del jugador
                </p>
                <button onClick={startScanner}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all">
                  Iniciar escáner
                </button>
              </div>
            ) : (
              <div>
                <div id="qr-reader-container" className="w-full" />
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm mb-3">
                    <Loader2 size={16} className="animate-spin" />
                    Escaneando...
                  </div>
                  <button onClick={stopScanner}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-all">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 text-center">
            <Loader2 size={36} className="mx-auto text-green-500 animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Verificando credencial...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div>
            {result.eligible && result.member ? (
              <div className="bg-gray-900 rounded-2xl overflow-hidden border-2" style={{ borderColor: memberColor }}>
                <div className="h-2" style={{ backgroundColor: memberColor }} />
                <div className="flex justify-center pt-6 pb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4" style={{ borderColor: memberColor }}>
                    {result.member.user.avatar ? (
                      <img src={result.member.user.avatar} alt={result.member.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                        style={{ backgroundColor: `${memberColor}33` }}>
                        {result.member.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-center mb-3">
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold">
                    <CheckCircle size={16} />
                    ✅ ELEGIBLE
                  </div>
                </div>
                <div className="text-center px-6 pb-6">
                  <h2 className="text-white text-2xl font-bold">{result.member.user.name}</h2>
                  <p className="mt-1 font-semibold" style={{ color: memberColor }}>{result.member.team.name}</p>
                  <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-400">
                    <span className="text-white text-xl font-bold">#{result.member.number}</span>
                    {result.member.position && <span>{result.member.position}</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-3 pt-3 border-t border-white/10">
                    {result.member.tournament.name}
                  </p>
                </div>
                <div className="h-2" style={{ backgroundColor: memberColor }} />
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-8 border-2 border-red-500/40 text-center">
                <XCircle size={64} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-white text-xl font-bold mb-2">❌ No registrado</h2>
                <p className="text-gray-400 text-sm">
                  {result.error ?? "Este jugador no está registrado o la credencial no es válida"}
                </p>
              </div>
            )}
            <button onClick={() => { setResult(null); setError(""); }}
              className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all">
              Escanear otro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
