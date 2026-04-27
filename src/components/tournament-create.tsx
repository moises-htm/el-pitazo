import { useState, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Eye, Save, Send, Layout, Image as ImageIcon, X, Check, AlertCircle } from "lucide-react";

interface FormState {
  name: string;
  description: string;
  type: string;
  maxTeams: number;
  startDate: string;
  endDate: string;
  regFee: number;
  currency: string;
  fieldLocation: string;
  fieldAddress: string;
  fieldLat: string;
  fieldLng: string;
  isPublic: boolean;
  coverImage: string;
}

const EMPTY: FormState = {
  name: "",
  description: "",
  type: "KNOCKOUT",
  maxTeams: 16,
  startDate: "",
  endDate: "",
  regFee: 500,
  currency: "MXN",
  fieldLocation: "",
  fieldAddress: "",
  fieldLat: "",
  fieldLng: "",
  isPublic: true,
  coverImage: "",
};

const TEMPLATES: Array<{ id: string; label: string; emoji: string; data: Partial<FormState> }> = [
  {
    id: "fut7",
    label: "Fut 7",
    emoji: "⚽",
    data: { type: "LEAGUE", maxTeams: 8, regFee: 1500, description: "Torneo de Fut 7 — 7 jugadores por equipo, partidos de 50 min." },
  },
  {
    id: "fut11",
    label: "Fut 11",
    emoji: "🏟️",
    data: { type: "LEAGUE", maxTeams: 12, regFee: 2500, description: "Torneo de Fut 11 — formato profesional, 90 min." },
  },
  {
    id: "futsal",
    label: "Futsal",
    emoji: "🥅",
    data: { type: "GROUPS", maxTeams: 16, regFee: 800, description: "Torneo de Futsal — 5 jugadores por equipo, dos tiempos de 20 min." },
  },
  {
    id: "blank",
    label: "En blanco",
    emoji: "📝",
    data: {},
  },
];

function validate(form: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.name.trim()) e.name = "El nombre es obligatorio";
  else if (form.name.trim().length < 3) e.name = "Mínimo 3 caracteres";
  if (form.maxTeams < 2) e.maxTeams = "Mínimo 2 equipos";
  if (form.maxTeams > 128) e.maxTeams = "Máximo 128 equipos";
  if (form.regFee < 0) e.regFee = "El costo no puede ser negativo";
  if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
    e.endDate = "La fecha de fin debe ser después del inicio";
  }
  if ((form.fieldLat && !form.fieldLng) || (!form.fieldLat && form.fieldLng)) {
    e.fieldLat = "Lat y Lng deben ir juntas";
  }
  return e;
}

function buildPayload(form: FormState, status: "DRAFT" | "ACTIVE") {
  return {
    ...form,
    status,
    fieldLat: parseFloat(form.fieldLat) || null,
    fieldLng: parseFloat(form.fieldLng) || null,
    startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
    endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
  };
}

export function TournamentCreate({ onCreated }: { onCreated?: (t: any) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errors = useMemo(() => validate(form), [form]);
  const valid = Object.keys(errors).length === 0;

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  function applyTemplate(tplId: string) {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setForm((s) => ({ ...s, ...tpl.data }));
    toast.success(`Plantilla "${tpl.label}" aplicada`);
  }

  async function uploadLogo(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 5MB)");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const data = await api<{ url: string }>("/api/upload/image", {
          method: "POST",
          body: JSON.stringify({ image: dataUrl, folder: "tournaments" }),
        });
        update("coverImage", data.url);
        toast.success("Logo subido");
      } catch (e: any) {
        toast.error(e.message || "Error al subir");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => { setUploading(false); toast.error("Error al leer la imagen"); };
    reader.readAsDataURL(file);
  }

  async function submit(status: "DRAFT" | "ACTIVE") {
    if (!valid) {
      toast.error("Revisa los campos marcados");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/tournaments", {
        method: "POST",
        body: JSON.stringify(buildPayload(form, status)),
      });
      toast.success(status === "DRAFT" ? "Borrador guardado" : "¡Torneo publicado!");
      setForm(EMPTY);
      setShowPreview(false);
      onCreated?.(data.tournament);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el torneo");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = (key: string) =>
    errors[key] ? "border-red-500/60 focus:border-red-500" : "border-white/10 focus:border-blue-500";

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-5">
      {/* Templates row (C-04) */}
      <div>
        <label className="text-gray-400 text-xs font-display uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Layout size={14} /> Plantilla
        </label>
        <div className="flex gap-2 flex-wrap">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl.id)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 text-sm flex items-center gap-1.5 transition-colors"
            >
              <span>{tpl.emoji}</span>
              <span className="text-gray-300 font-display uppercase tracking-wide text-xs">{tpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-white font-bold text-lg mb-4">Crear Torneo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-gray-400 text-xs font-display uppercase tracking-wide mb-1 block">Logo / portada</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {form.coverImage ? (
                  <img src={form.coverImage} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={28} className="text-gray-600" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-300 disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : form.coverImage ? "Cambiar" : "Subir imagen"}
              </button>
              {form.coverImage && (
                <button
                  type="button"
                  onClick={() => update("coverImage", "")}
                  className="text-gray-500 hover:text-red-400 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre del torneo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("name")}`}
              placeholder="Ej: Liga Sabatina CDMX"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Tipo de torneo *</label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="KNOCKOUT">Eliminatoria</option>
              <option value="LEAGUE">Liga</option>
              <option value="GROUPS">Grupos + Eliminatoria</option>
              <option value="SWISS">Swiss</option>
            </select>
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Máximo de equipos</label>
            <input
              type="number"
              min={2}
              max={128}
              value={form.maxTeams}
              onChange={(e) => update("maxTeams", parseInt(e.target.value) || 2)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("maxTeams")}`}
            />
            {errors.maxTeams && <p className="text-red-400 text-xs mt-1">{errors.maxTeams}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Fecha de inicio</label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Fecha de fin</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("endDate")}`}
            />
            {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Costo de inscripción</label>
            <input
              type="number"
              min={0}
              value={form.regFee || ""}
              onChange={(e) => update("regFee", parseFloat(e.target.value) || 0)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("regFee")}`}
              placeholder="0"
            />
            {errors.regFee && <p className="text-red-400 text-xs mt-1">{errors.regFee}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Moneda</label>
            <select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="MXN">MXN — Peso Mexicano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-gray-300 text-sm block mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Reglas, cupos, premios..."
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Ubicación</label>
            <input
              type="text"
              value={form.fieldLocation}
              onChange={(e) => update("fieldLocation", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Nombre del campo"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Dirección</label>
            <input
              type="text"
              value={form.fieldAddress}
              onChange={(e) => update("fieldAddress", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Calle, colonia, ciudad"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Latitud (opcional)</label>
            <input
              type="number"
              step="any"
              value={form.fieldLat}
              onChange={(e) => update("fieldLat", e.target.value)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none text-sm ${fieldClass("fieldLat")}`}
              placeholder="19.4326"
            />
            {errors.fieldLat && <p className="text-red-400 text-xs mt-1">{errors.fieldLat}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Longitud (opcional)</label>
            <input
              type="number"
              step="any"
              value={form.fieldLng}
              onChange={(e) => update("fieldLng", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
              placeholder="-99.1332"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => update("isPublic", e.target.checked)}
              className="w-4 h-4 rounded accent-green-500"
            />
            <label htmlFor="isPublic" className="text-gray-300 text-sm">Torneo público (visible en exploración)</label>
          </div>
        </div>

        <div className="flex gap-2 mt-6 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex-1 min-w-[140px] px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2 text-sm"
          >
            <Eye size={16} /> Vista previa
          </button>
          <button
            type="button"
            onClick={() => submit("DRAFT")}
            disabled={loading || !valid}
            className="flex-1 min-w-[140px] px-4 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Save size={16} /> {loading ? "..." : "Guardar borrador"}
          </button>
          <button
            type="button"
            onClick={() => submit("ACTIVE")}
            disabled={loading || !valid}
            className="flex-1 min-w-[140px] px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Send size={16} /> {loading ? "..." : "Publicar"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display font-black uppercase text-white text-lg">Vista previa</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              {form.coverImage ? (
                <div className="rounded-xl overflow-hidden mb-4 aspect-video bg-white/5">
                  <img src={form.coverImage} alt="cover" className="w-full h-full object-cover" />
                </div>
              ) : null}
              <h2 className="font-display font-black text-2xl uppercase text-white">{form.name || "Sin nombre"}</h2>
              {form.description && <p className="text-gray-400 text-sm mt-1">{form.description}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-display uppercase">{form.type}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-display uppercase">{form.maxTeams} equipos</span>
                {form.isPublic ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-display uppercase">Público</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 font-display uppercase">Privado</span>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-300">
                {form.startDate && <div>📅 Inicia: {new Date(form.startDate).toLocaleString("es-MX")}</div>}
                {form.endDate && <div>🏁 Fin: {new Date(form.endDate).toLocaleString("es-MX")}</div>}
                {form.fieldLocation && <div>📍 {form.fieldLocation}{form.fieldAddress && ` — ${form.fieldAddress}`}</div>}
                <div>💰 Cuota: ${form.regFee} {form.currency}</div>
              </div>
              {!valid && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  Hay errores en el formulario. Corrige antes de publicar.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2 sticky bottom-0 bg-gray-900">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm"
              >
                Volver a editar
              </button>
              <button
                onClick={() => submit("ACTIVE")}
                disabled={loading || !valid}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Check size={14} /> Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
