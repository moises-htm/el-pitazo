import { useState, useRef } from "react";
import { Camera, Check, X } from "lucide-react";

interface Props {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export function SelfieCapture({ onCapture, onClose }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d")!;
        const size = Math.min(img.width, img.height);
        const ox = (img.width - size) / 2;
        const oy = (img.height - size) / 2;
        ctx.drawImage(img, ox, oy, size, size, 0, 0, 400, 400);
        setPreview(canvas.toDataURL("image/jpeg", 0.85));
        setProcessing(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-xs border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Tu foto de credencial</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="w-40 h-40 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white/20 bg-gray-800 flex items-center justify-center">
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" alt="Selfie preview" />
          ) : (
            <Camera size={40} className="text-gray-500" />
          )}
        </div>

        {processing && <p className="text-center text-gray-400 text-sm mb-3">Procesando...</p>}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          {...({ capture: "user" } as any)}
          className="hidden"
          onChange={handleFile}
        />

        <button
          onClick={() => inputRef.current?.click()}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-3"
        >
          <Camera size={18} />
          {preview ? "Tomar otra foto" : "Abrir cámara"}
        </button>

        {preview && (
          <button
            onClick={() => onCapture(preview)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Usar esta foto
          </button>
        )}

        <p className="text-gray-500 text-xs text-center mt-3">
          Esta foto aparecerá en tu credencial y en la verificación del árbitro
        </p>
      </div>
    </div>
  );
}
