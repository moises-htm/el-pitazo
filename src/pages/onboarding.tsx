import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";

// ── Question definitions ────────────────────────────────────────────────────

type Option = { value: string; label: string; emoji: string };

interface Question {
  id: string;
  question: string;
  sub?: string;
  type: "single" | "multi" | "text";
  options?: Option[];
  placeholder?: string;
}

const JUGADOR_QUESTIONS: Question[] = [
  {
    id: "nivel",
    question: "¿Cuál es tu nivel de juego?",
    sub: "Sé honesto, para emparejarte con el torneo ideal",
    type: "single",
    options: [
      { value: "principiante", label: "Principiante", emoji: "🌱" },
      { value: "amateur", label: "Amateur", emoji: "⚽" },
      { value: "intermedio", label: "Intermedio", emoji: "🏅" },
      { value: "avanzado", label: "Avanzado", emoji: "🔥" },
      { value: "semi_pro", label: "Semi-profesional", emoji: "🌟" },
    ],
  },
  {
    id: "posicion",
    question: "¿Cuál es tu posición favorita?",
    sub: "Elige la que más juegas",
    type: "single",
    options: [
      { value: "portero", label: "Portero", emoji: "🧤" },
      { value: "defensa", label: "Defensa Central", emoji: "🛡️" },
      { value: "lateral", label: "Lateral", emoji: "↔️" },
      { value: "mediocampista", label: "Mediocampista", emoji: "🎯" },
      { value: "extremo", label: "Extremo", emoji: "⚡" },
      { value: "delantero", label: "Delantero", emoji: "🎯" },
    ],
  },
  {
    id: "ciudad",
    question: "¿En qué ciudad juegas?",
    sub: "Para mostrarte torneos cerca de ti",
    type: "text",
    placeholder: "Ej: Ciudad de México, Guadalajara...",
  },
  {
    id: "como_nos_encontro",
    question: "¿Cómo te enteraste de El Pitazo?",
    type: "single",
    options: [
      { value: "redes_sociales", label: "Redes sociales", emoji: "📱" },
      { value: "amigo", label: "Me lo recomendó un amigo", emoji: "👥" },
      { value: "google", label: "Busqué en Google", emoji: "🔍" },
      { value: "publicidad", label: "Vi publicidad", emoji: "📢" },
      { value: "mi_equipo", label: "Mi equipo ya estaba aquí", emoji: "⚽" },
    ],
  },
];

const ARBITRO_QUESTIONS: Question[] = [
  {
    id: "experiencia",
    question: "¿Cuántos años llevas arbitrando?",
    type: "single",
    options: [
      { value: "menos_1", label: "Menos de 1 año", emoji: "🌱" },
      { value: "1_3", label: "1 a 3 años", emoji: "📋" },
      { value: "3_5", label: "3 a 5 años", emoji: "🏅" },
      { value: "5_10", label: "5 a 10 años", emoji: "⭐" },
      { value: "mas_10", label: "Más de 10 años", emoji: "🏆" },
    ],
  },
  {
    id: "certificaciones",
    question: "¿Tienes certificaciones?",
    sub: "Selecciona todas las que apliquen",
    type: "multi",
    options: [
      { value: "ninguna", label: "Sin certificación formal", emoji: "📝" },
      { value: "estatal", label: "Certificación estatal", emoji: "🏛️" },
      { value: "fmf", label: "Certificación FMF", emoji: "🇲🇽" },
      { value: "fifa", label: "Certificación FIFA", emoji: "🌍" },
      { value: "otro", label: "Otras certificaciones", emoji: "📜" },
    ],
  },
  {
    id: "disponibilidad",
    question: "¿Cuándo estás disponible?",
    sub: "Puedes elegir varias opciones",
    type: "multi",
    options: [
      { value: "sabados", label: "Sábados", emoji: "📅" },
      { value: "domingos", label: "Domingos", emoji: "📅" },
      { value: "entre_semana", label: "Entre semana (lun-vie)", emoji: "💼" },
      { value: "mananas", label: "Solo mañanas", emoji: "🌅" },
      { value: "tardes", label: "Tardes/noches", emoji: "🌙" },
    ],
  },
  {
    id: "zona",
    question: "¿En qué zona puedes arbitrar?",
    sub: "Colonia, alcaldía o municipio preferido",
    type: "text",
    placeholder: "Ej: Iztapalapa, Tlalnepantla, Zona Norte...",
  },
];

const ORGANIZADOR_QUESTIONS: Question[] = [
  {
    id: "tamano_liga",
    question: "¿Cuántos equipos tiene tu torneo?",
    type: "single",
    options: [
      { value: "4_8", label: "4 a 8 equipos", emoji: "🔸" },
      { value: "9_16", label: "9 a 16 equipos", emoji: "🔶" },
      { value: "17_32", label: "17 a 32 equipos", emoji: "🔴" },
      { value: "mas_32", label: "Más de 32 equipos", emoji: "🏟️" },
      { value: "no_se", label: "Todavía no lo sé", emoji: "🤔" },
    ],
  },
  {
    id: "cancha",
    question: "¿Tienes cancha disponible?",
    type: "single",
    options: [
      { value: "propia", label: "Sí, tengo cancha propia", emoji: "🏟️" },
      { value: "alquilo", label: "Alquilo canchas", emoji: "🔑" },
      { value: "municipales", label: "Uso canchas públicas/municipales", emoji: "🏙️" },
      { value: "buscando", label: "Todavía estoy buscando", emoji: "🔍" },
    ],
  },
  {
    id: "formato",
    question: "¿Qué formato de torneo prefieres?",
    type: "single",
    options: [
      { value: "liga", label: "Liga (todos contra todos)", emoji: "🔄" },
      { value: "copa", label: "Copa (eliminación directa)", emoji: "🏆" },
      { value: "grupos_eliminacion", label: "Grupos + Eliminatorias", emoji: "📊" },
      { value: "round_robin", label: "Round Robin", emoji: "🔁" },
      { value: "sin_decidir", label: "Aún no lo he decidido", emoji: "🤔" },
    ],
  },
  {
    id: "cuota",
    question: "¿Cuál será la cuota de inscripción?",
    sub: "Ayuda a los equipos a prepararse",
    type: "single",
    options: [
      { value: "gratis", label: "Gratuito", emoji: "🎁" },
      { value: "500_1500", label: "$500 – $1,500 MXN", emoji: "💵" },
      { value: "1500_3000", label: "$1,500 – $3,000 MXN", emoji: "💴" },
      { value: "3000_5000", label: "$3,000 – $5,000 MXN", emoji: "💶" },
      { value: "mas_5000", label: "Más de $5,000 MXN", emoji: "💎" },
    ],
  },
];

function questionsForRole(role: string): Question[] {
  if (role === "REFEREE") return ARBITRO_QUESTIONS;
  if (role === "ORGANIZER") return ORGANIZADOR_QUESTIONS;
  return JUGADOR_QUESTIONS;
}

function roleName(role: string) {
  if (role === "REFEREE") return "Árbitro";
  if (role === "ORGANIZER") return "Organizador";
  return "Jugador";
}

// ── Component ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [step, setStep] = useState<"welcome" | "questions" | "processing" | "done">("welcome");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [textVal, setTextVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const primaryRole: string = user?.role?.[0] ?? "PLAYER";
  const questions = questionsForRole(primaryRole);
  const current = questions[qIndex];
  const totalSteps = questions.length;

  // Redirect if not logged in or already completed onboarding
  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    // If the URL has ?skip=1, go straight to dashboard
    if (router.query.skip === "1") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  function progressPct() {
    if (step === "welcome") return 0;
    if (step === "processing" || step === "done") return 100;
    return Math.round(((qIndex + 1) / (totalSteps + 1)) * 100);
  }

  // ── Single-select ──────────────────────────────────────────────────────────
  function selectSingle(value: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  }

  // ── Multi-select ───────────────────────────────────────────────────────────
  function toggleMulti(value: string) {
    setAnswers((prev) => {
      const existing = (prev[current.id] as string[]) ?? [];
      const next = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...prev, [current.id]: next };
    });
  }

  function hasAnswer() {
    if (current.type === "text") return textVal.trim().length > 0;
    if (current.type === "multi") return ((answers[current.id] as string[]) ?? []).length > 0;
    return !!answers[current.id];
  }

  // ── Next step ──────────────────────────────────────────────────────────────
  function handleNext() {
    const updatedAnswers = { ...answers };
    if (current.type === "text") {
      updatedAnswers[current.id] = textVal;
      setAnswers(updatedAnswers);
      setTextVal("");
    }

    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      return;
    }

    // Last question → save and show processing
    setStep("processing");
    saveOnboarding(updatedAnswers);
  }

  async function saveOnboarding(data: Record<string, string | string[]>) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ onboardingData: data, complete: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status}`);
      }
      setSaving(false);
      setTimeout(() => router.replace("/dashboard"), 2200);
    } catch (e) {
      setSaving(false);
      setSaveError(e instanceof Error ? e.message : "No pudimos guardar tus respuestas");
      // Stay on processing step; user can retry via the error UI.
    }
  }

  // ── Welcome screen ─────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-pitch-grid flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="text-6xl mb-6">⚽</div>
          <h1 className="font-display font-black text-5xl uppercase text-white mb-3 leading-tight">
            ¡Bienvenido,<br />
            <span className="text-neon-glow">{user?.name?.split(" ")[0]}!</span>
          </h1>
          <p className="text-gray-400 text-base mb-2">
            Eres <span className="text-white font-semibold">{roleName(primaryRole)}</span> en El Pitazo.
          </p>
          <p className="text-gray-500 text-sm mb-10">
            Responde {totalSteps} preguntas rápidas para personalizar tu experiencia.
          </p>

          {/* Feature preview */}
          <div className="card-glass rounded-2xl p-5 mb-10 text-left space-y-3">
            {primaryRole === "PLAYER" && (
              <>
                <FeatureItem emoji="🏆" text="Torneos cerca de ti, según tu nivel" />
                <FeatureItem emoji="👥" text="Encuentra equipo o inscríbete solo" />
                <FeatureItem emoji="📊" text="Tus estadísticas y tu credencial digital" />
              </>
            )}
            {primaryRole === "REFEREE" && (
              <>
                <FeatureItem emoji="📅" text="Agenda de partidos según tu disponibilidad" />
                <FeatureItem emoji="💰" text="Registro de honorarios y pagos" />
                <FeatureItem emoji="📋" text="Reportes de partido fáciles de llenar" />
              </>
            )}
            {primaryRole === "ORGANIZER" && (
              <>
                <FeatureItem emoji="🏟️" text="Bracket automático y gestión de equipos" />
                <FeatureItem emoji="💳" text="Cobro de cuotas vía MercadoPago o OXXO" />
                <FeatureItem emoji="📡" text="Feed de noticias y chat para tu liga" />
              </>
            )}
          </div>

          <button
            onClick={() => setStep("questions")}
            className="btn-neon w-full py-4 rounded-xl text-lg"
          >
            Comenzar →
          </button>
          <button
            onClick={() => router.replace("/dashboard")}
            className="mt-4 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    );
  }

  // ── Processing screen ──────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-pitch-grid flex flex-col items-center justify-center px-6">
        <div className="text-center animate-fade-in max-w-sm">
          {saveError ? (
            <>
              <div className="text-5xl mb-6">⚠️</div>
              <h2 className="font-display font-black text-3xl uppercase text-white mb-3">
                No pudimos guardar
              </h2>
              <p className="text-red-400 text-sm mb-6">{saveError}</p>
              <button
                onClick={() => saveOnboarding(answers)}
                disabled={saving}
                className="bg-[#39FF14] text-black font-bold uppercase px-6 py-3 rounded-xl disabled:opacity-50"
              >
                {saving ? "Reintentando…" : "Reintentar"}
              </button>
            </>
          ) : (
            <>
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 rounded-full border-4 border-[#39FF14]/20 border-t-[#39FF14] animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl">⚽</span>
              </div>
              <h2 className="font-display font-black text-3xl uppercase text-white mb-3">
                Preparando tu perfil
              </h2>
              <p className="text-gray-400 text-sm">Personalizando tu experiencia en El Pitazo...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Question screens ───────────────────────────────────────────────────────
  const selectedSingle = answers[current.id] as string | undefined;
  const selectedMulti = (answers[current.id] as string[]) ?? [];

  return (
    <div className="min-h-screen bg-pitch-grid flex flex-col px-6 py-10">
      {/* Progress bar */}
      <div className="w-full max-w-sm mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-xs font-display uppercase tracking-widest">
            {qIndex + 1} / {totalSteps}
          </span>
          <span className="text-gray-500 text-xs">{progressPct()}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#39FF14] rounded-full transition-all duration-500"
            style={{ width: `${progressPct()}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col animate-fade-in">
        <div className="mb-8">
          <h2 className="font-display font-black text-4xl uppercase text-white leading-tight mb-2">
            {current.question}
          </h2>
          {current.sub && (
            <p className="text-gray-500 text-sm">{current.sub}</p>
          )}
        </div>

        {/* Single select */}
        {current.type === "single" && current.options && (
          <div className="space-y-3 flex-1">
            {current.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectSingle(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  selectedSingle === opt.value
                    ? "bg-[#39FF14]/10 border-[#39FF14] text-white"
                    : "bg-white/4 border-white/10 text-gray-300 hover:border-white/25 hover:text-white"
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="font-display font-bold text-lg uppercase tracking-wide">
                  {opt.label}
                </span>
                {selectedSingle === opt.value && (
                  <span className="ml-auto text-[#39FF14] text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Multi select */}
        {current.type === "multi" && current.options && (
          <div className="space-y-3 flex-1">
            {current.options.map((opt) => {
              const checked = selectedMulti.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleMulti(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    checked
                      ? "bg-[#39FF14]/10 border-[#39FF14] text-white"
                      : "bg-white/4 border-white/10 text-gray-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="font-display font-bold text-lg uppercase tracking-wide flex-1">
                    {opt.label}
                  </span>
                  <span
                    className={`w-5 h-5 rounded border flex items-center justify-center text-xs flex-shrink-0 transition-all ${
                      checked ? "bg-[#39FF14] border-[#39FF14] text-black" : "border-white/30"
                    }`}
                  >
                    {checked ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Text input */}
        {current.type === "text" && (
          <div className="flex-1">
            <input
              type="text"
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && hasAnswer() && handleNext()}
              className="input-neon text-lg"
              placeholder={current.placeholder}
              autoFocus
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleNext}
            disabled={!hasAnswer() || saving}
            className="btn-neon w-full py-4 rounded-xl text-lg disabled:opacity-40"
          >
            {qIndex < questions.length - 1 ? "Siguiente →" : "Finalizar →"}
          </button>
          {qIndex > 0 && (
            <button
              onClick={() => setQIndex((i) => i - 1)}
              className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors py-2"
            >
              ← Regresar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl w-8 text-center flex-shrink-0">{emoji}</span>
      <span className="text-gray-300 text-sm">{text}</span>
    </div>
  );
}
