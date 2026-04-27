import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Eye, Edit3, Copy, Image as ImageIcon, X } from "lucide-react";

type TemplateId =
  | "FUTBOL_5_KO_8"
  | "FUTBOL_7_KO_16"
  | "FUTBOL_11_LIGA_8"
  | "FUTBOL_11_GRUPOS_16";

const TEMPLATES: Record<TemplateId, { label: string; preset: Partial<FormState> }> = {
  FUTBOL_5_KO_8: {
    label: "Fútbol 5 — Eliminatoria 8",
    preset: { type: "KNOCKOUT", maxTeams: 8, name: "Fútbol 5 — Cup", regFee: 300 },
  },
  FUTBOL_7_KO_16: {
    label: "Fútbol 7 — Eliminatoria 16",
    preset: { type: "KNOCKOUT", maxTeams: 16, name: "Fútbol 7 — Cup", regFee: 500 },
  },
  FUTBOL_11_LIGA_8: {
    label: "Fútbol 11 — Liga 8",
    preset: { type: "LEAGUE", maxTeams: 8, name: "Liga Fútbol 11", regFee: 1500 },
  },
  FUTBOL_11_GRUPOS_16: {
    label: "Fútbol 11 — Grupos 16",
    preset: { type: "GROUPS", maxTeams: 16, name: "Copa Fútbol 11", regFee: 2000 },
  },
};

interface FormState {
  name: string;
  type: string;
  description: string;
  maxTeams: number;
  startDate: string;
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
  type: "KNOCKOUT",
  description: "",
  maxTeams: 16,
  startDate: "",
  regFee: 500,
  currency: "MXN",
  fieldLocation: "",
  fieldAddress: "",
  fieldLat: "",
  fieldLng: "",
  isPublic: true,
  coverImage: "",
};

export function TournamentCreate({ onCreated, duplicate }: { onCreated?: (t: any) => void; duplicate?: any }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (duplicate) {
      setForm({
        ...EMPTY,
        name: `${duplicate.name} — copia`,
        type: duplicate.type,
        description: duplicate.description || "",
        maxTeams: duplicate.maxTeams,
        regFee: Number(duplicate.regFee),
        currency: duplicate.currency,
        fieldLocation: duplicate.fieldLocation || "",
        fieldAddress: duplicate.fieldAddress || "",
        fieldLat: duplicate.fieldLat ? String(duplicate.fieldLat) : "",
        fieldLng: duplicate.fieldLng ? String(duplicate.fieldLng) : "",
        coverImage: duplicate.coverImage || "",
        isPublic: duplicate.isPublic ?? true,
        startDate: "",
      });
      toast.info("Plantilla cargada — ajusta y guarda");
    }
  }, [duplicate]);

  const applyTemplate = (id: TemplateId) => {
    const tpl = TEMPLATES[id];
    setForm((prev) => ({ ...prev, ...tpl.preset }));
    toast.info(`Plantilla "${tpl.label}" aplicada`);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (form.maxTeams < 2) e.maxTeams = "Mínimo 2 equipos";
    if (form.regFee < 0) e.regFee = "El costo no puede ser negativo";
    if (form.startDate) {
      const d = new Date(form.startDate);
      if (isNaN(d.getTime())) e.startDate = "Fecha inválida";
      else if (d.getTime() < Date.now() - 24 * 3600 * 1000) e.startDate = "La fecha no puede ser pasada";
    }
    return e;
  };

  const submit = async (status: "ACTIVE" | "DRAFT") => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setMode("edit");
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const data = await api("/api/tournaments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          status,
          fieldLat: parseFloat(form.fieldLat) || null,
          fieldLng: parseFloat(form.fieldLng) || null,
        }),
      });
      toast.success(status === "DRAFT" ? "Borrador guardado" : "¡Torneo creado!");
      setForm(EMPTY);
      setMode("edit");
      onCreated?.(data.tournament);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el torneo");
    } finally {
      setLoading(false);
    }
  };

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Logo demasiado grande (máx 1.5MB)");
      return;
    }
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({ ...p, coverImage: String(reader.result) }));
      setLogoUploading(false);
    };
    reader.onerror = () => {
      toast.error("No se pudo leer el archivo");
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const fieldClass = (key: string) =>
    errors[key] ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500";

  if (mode === "preview") {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Vista previa</h2>
          <button onClick={() => setMode("edit")} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
            <Edit3 size={14} /> Editar
          </button>
        </div>
        {form.coverImage && (
          <img src={form.coverImage} alt="Cover" className="w-full h-32 object-cover rounded-xl" />
        )}
        <div className="space-y-2">
          <h3 className="text-white text-2xl font-display font-black uppercase">{form.name || "Sin nombre"}</h3>
          {form.description && <p className="text-gray-300 text-sm">{form.description}</p>}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white/5 px-2 py-1 rounded">{form.type}</span>
            <span className="bg-white/5 px-2 py-1 rounded">{form.maxTeams} equipos</span>
            <span className="bg-white/5 px-2 py-1 rounded">{form.regFee} {form.currency}</span>
            {form.fieldLocation && <span className="bg-white/5 px-2 py-1 rounded">📍 {form.fieldLocation}</span>}
            {form.startDate && <span className="bg-white/5 px-2 py-1 rounded">⏰ {new Date(form.startDate).toLocaleString("es-MX")}</span>}
            {form.isPublic ? (
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Público</span>
            ) : (
              <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded">Privado</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => submit("DRAFT")}
            disabled={loading}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar como borrador"}
          </button>
          <button
            type="button"
            onClick={() => submit("ACTIVE")}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Creando…" : "Publicar torneo"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">Crear Nuevo Torneo</h2>
        <select
          onChange={(e) => e.target.value && applyTemplate(e.target.value as TemplateId)}
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300"
          defaultValue=""
        >
          <option value="">📋 Plantilla…</option>
          {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
            <option key={id} value={id}>{TEMPLATES[id].label}</option>
          ))}
        </select>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setMode("preview"); }} className="space-y-4">
        {/* Logo */}
        <div>
          <label className="text-gray-300 text-sm block mb-1">Logo / Imagen del torneo</label>
          <div className="flex items-center gap-3">
            {form.coverImage ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                <img src={form.coverImage} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, coverImage: "" })}
                  className="absolute top-0 right-0 bg-black/70 p-0.5 rounded-bl"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-600">
                <ImageIcon size={20} />
              </div>
            )}
            <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg text-sm text-gray-300">
              {logoUploading ? "Subiendo…" : form.coverImage ? "Cambiar" : "Subir logo"}
              <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} disabled={logoUploading} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre del torneo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("name")}`}
              placeholder="Ej: Torneo Barrenderos CDMX"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Tipo de torneo *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="KNOCKOUT">Eliminatoria</option>
              <option value="LEAGUE">Liga</option>
              <option value="GROUPS">Grupos + Eliminatoria</option>
              <option value="SWISS">Swiss</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-gray-300 text-sm block mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Reglas, premios, contacto…"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Máximo de equipos</label>
            <input
              type="number" min={2} max={128}
              value={form.maxTeams}
              onChange={(e) => setForm({ ...form, maxTeams: parseInt(e.target.value) || 2 })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("maxTeams")}`}
            />
            {errors.maxTeams && <p className="text-red-400 text-xs mt-1">{errors.maxTeams}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Fecha de inicio</label>
            <input
              type="datetime-local" value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("startDate")}`}
            />
            {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Costo de inscripción</label>
            <input
              type="number" min={0}
              value={form.regFee}
              onChange={(e) => setForm({ ...form, regFee: parseFloat(e.target.value) || 0 })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${fieldClass("regFee")}`}
            />
            {errors.regFee && <p className="text-red-400 text-xs mt-1">{errors.regFee}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Moneda</label>
            <select
              value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="MXN">MXN — Peso Mexicano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Ubicación del campo</label>
            <input
              type="text" value={form.fieldLocation}
              onChange={(e) => setForm({ ...form, fieldLocation: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Nombre del campo"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Dirección del campo</label>
            <input
              type="text" value={form.fieldAddress}
              onChange={(e) => setForm({ ...form, fieldAddress: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Calle, colonia, ciudad"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Latitud (opcional)</label>
            <input
              type="number" step="any" value={form.fieldLat}
              onChange={(e) => setForm({ ...form, fieldLat: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
              placeholder="19.4326"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Longitud (opcional)</label>
            <input
              type="number" step="any" value={form.fieldLng}
              onChange={(e) => setForm({ ...form, fieldLng: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
              placeholder="-99.1332"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="public" type="checkbox" checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="rounded border-white/10"
            />
            <label htmlFor="public" className="text-gray-300 text-sm select-none cursor-pointer">
              Torneo público (aparecerá en búsquedas)
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => submit("DRAFT")}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 px-5 rounded-xl font-semibold disabled:opacity-50"
            title="Guarda sin publicar"
          >
            <Copy size={16} /> Borrador
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold"
          >
            <Eye size={16} /> Vista previa
          </button>
        </div>
      </form>
    </div>
  );
}
