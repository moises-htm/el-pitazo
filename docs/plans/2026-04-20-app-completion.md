# App Completion — All 7 Punch List Items

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform el-pitazo from a polished mockup into a working app — real data everywhere, no dead buttons, proper loading/empty states, inline validation, mobile-safe bracket, clean error messages.

**Architecture:** Next.js pages-router app with Prisma/Neon DB. All API routes are Next.js API routes under `src/pages/api/`. Client state lives in Zustand (`src/lib/auth.ts`). All API calls go through `src/lib/api.ts` helper which attaches the JWT token automatically. No Express backend involved — everything is serverless.

**Tech Stack:** Next.js 16, Prisma 6, Neon PostgreSQL, Zustand, Tailwind CSS, Sonner toasts, Lucide React icons.

**Working directory:** `/Users/gbfbot/Documents/el-pitazo`
**Dev server for testing:** `npm run dev` (port 3000 or next available)

---

## Task 1 — Fix home page CTAs + register role hydration

**Files:**
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/auth/register.tsx`

**Step 1: Fix index.tsx**

Replace the entire file content:

```tsx
import { useRouter } from "next/router";
import { ArrowRight, Volleyball as Football } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const features = [
    { icon: "⚽", title: "Gestión Completa", desc: "Crea torneos, gestiona equipos, emparejamientos y resultados en tiempo real" },
    { icon: "💳", title: "Pagos LATAM", desc: "SPEI, Oxxo, MercadoPago y Stripe — los métodos que tus jugadores necesitan" },
    { icon: "📊", title: "Panel por Rol", desc: "Vistas personalizadas para jugadores, árbitros y organizadores" },
    { icon: "🔄", title: "Tiempo Real", desc: "Resultados, estadísticas y actualizaciones instantáneas vía WebSocket" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Football size={48} className="text-emerald-400" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              El Pitazo
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            La plataforma completa para torneos de fútbol amateur en Latinoamérica
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push("/auth/register")}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-colors"
            >
              Registrarse gratis
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((f) => (
            <div key={f.title} className="p-6 bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-colors">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Para cada rol</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { role: "Jugador", icon: "🏃", desc: "Únete a torneos, revisa resultados y estadísticas", q: "PLAYER" },
            { role: "Árbitro", icon: "🟨", desc: "Gestiona partidos, envía reportes y cobra por juego", q: "REFEREE" },
            { role: "Organizador", icon: "👔", desc: "Crea torneos, gestiona equipos y finanzas", q: "ORGANIZER" },
          ].map((r) => (
            <button
              key={r.role}
              onClick={() => router.push(`/auth/register?role=${r.q}`)}
              className="p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-colors text-left"
            >
              <div className="text-5xl mb-4">{r.icon}</div>
              <h3 className="text-xl font-bold mb-2">{r.role}</h3>
              <p className="text-gray-400">{r.desc}</p>
            </button>
          ))}
        </div>

        <div className="text-center p-12 bg-gradient-to-r from-emerald-900/50 to-teal-900/30 rounded-3xl border border-emerald-700/30">
          <h2 className="text-3xl font-bold mb-4">¿Listo para jugar?</h2>
          <p className="text-gray-400 mb-8">Crea tu primer torneo en minutos y empieza a jugar</p>
          <button
            onClick={() => router.push("/auth/register")}
            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-lg transition-colors inline-flex items-center gap-2"
          >
            Comenzar Ahora <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Fix register.tsx — role from query without hydration mismatch**

Replace the `useState` initialization and add a `useEffect` to sync role from query after hydration:

```tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "MX",
    lang: "es",
    role: "PLAYER" as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pwStrength, setPwStrength] = useState(0); // 0-3

  // Sync role from URL query after hydration
  useEffect(() => {
    const q = router.query.role as string | undefined;
    if (q && ["PLAYER", "REFEREE", "ORGANIZER"].includes(q)) {
      setForm((f) => ({ ...f, role: q }));
    }
  }, [router.query.role]);

  const calcStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++;
    return s;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError("Las contraseñas no coinciden");
    if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (!form.name.trim()) return setError("El nombre es obligatorio");
    if (!form.phone && !form.email) return setError("Necesitas teléfono o email");

    setLoading(true);
    setError("");
    try {
      await register(form as any);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["", "Débil", "Regular", "Fuerte"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white mb-6 flex items-center gap-1">
          <ArrowLeft size={18} /> Volver
        </button>

        {/* Role selector */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm text-center mb-3">¿Cómo vas a usar El Pitazo?</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "PLAYER", label: "Jugador", icon: "⚽" },
              { id: "REFEREE", label: "Árbitro", icon: "🟨" },
              { id: "ORGANIZER", label: "Organizador", icon: "👔" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setForm({ ...form, role: r.id })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.role === r.id
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                }`}
              >
                <div className="text-xl">{r.icon}</div>
                <div className="text-xs mt-1 font-medium">{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${form.name.trim() ? "border-green-500/50 focus:border-green-500" : "border-white/10 focus:border-blue-500"}`}
              placeholder="Tu nombre completo" />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Teléfono o Email *</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                placeholder="+52 55 1234 5678" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                placeholder="tu@email.com" />
            </div>
            <p className="text-gray-500 text-xs mt-1">Necesitas al menos uno</p>
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Contraseña *</label>
            <input type="password" value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setPwStrength(calcStrength(e.target.value)); }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Mínimo 6 caracteres" />
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[0,1,2].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < pwStrength ? strengthColors[pwStrength] : "bg-white/10"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{strengthLabels[pwStrength]}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Confirmar contraseña *</label>
            <input type="password" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
                form.confirmPassword && form.password !== form.confirmPassword
                  ? "border-red-500/50 focus:border-red-500"
                  : form.confirmPassword && form.password === form.confirmPassword
                  ? "border-green-500/50 focus:border-green-500"
                  : "border-white/10 focus:border-blue-500"
              }`}
              placeholder="Repite la contraseña" />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50">
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-400">¿Ya tienes cuenta? </span>
            <button type="button" onClick={() => router.push("/auth/login")} className="text-blue-400 hover:text-blue-300 underline">
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add src/pages/index.tsx src/pages/auth/register.tsx
git commit -m "fix(ux): home CTAs route to register, role selector + pw strength on register"
```

---

## Task 2 — New API routes: player stats, player tournaments, referee schedule

**Files:**
- Create: `src/pages/api/player/stats.ts`
- Create: `src/pages/api/player/tournaments.ts`
- Create: `src/pages/api/referee/schedule.ts`
- Create: `src/pages/api/referee/earnings.ts`

**Step 1: Create `src/pages/api/player/stats.ts`**

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
    return payload.userId;
  } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const events = await prisma.matchEvent.groupBy({
      by: ["eventType"],
      where: { playerId: userId },
      _count: { eventType: true },
    });

    const matchIds = await prisma.matchEvent.findMany({
      where: { playerId: userId },
      select: { matchId: true },
      distinct: ["matchId"],
    });

    const countMap: Record<string, number> = {};
    for (const e of events) countMap[e.eventType] = e._count.eventType;

    return res.json({
      matches: matchIds.length,
      goals: countMap["GOAL"] || 0,
      assists: countMap["ASSIST"] || 0,
      yellowCards: countMap["YELLOW_CARD"] || 0,
      redCards: countMap["RED_CARD"] || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "No se pudo obtener las estadísticas" });
  }
}
```

**Step 2: Create `src/pages/api/player/tournaments.ts`**

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
    return payload.userId;
  } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            tournament: { select: { id: true, name: true, status: true, startDate: true, endDate: true, type: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const tournaments = memberships.map((m) => ({
      id: m.team.tournament.id,
      name: m.team.tournament.name,
      status: m.team.tournament.status,
      startDate: m.team.tournament.startDate,
      endDate: m.team.tournament.endDate,
      type: m.team.tournament.type,
      teamName: m.team.name,
      isCaptain: m.isCaptain,
    }));

    return res.json({ tournaments });
  } catch (err: any) {
    return res.status(500).json({ error: "No se pudo obtener los torneos" });
  }
}
```

**Step 3: Create `src/pages/api/referee/schedule.ts`**

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
    return payload.userId;
  } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignments = await prisma.refereeAssignment.findMany({
      where: {
        refereeId: userId,
        match: { scheduledAt: { gte: today, lt: tomorrow } },
      },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true, colorHex: true } },
            awayTeam: { select: { name: true, colorHex: true } },
            field: { select: { name: true } },
            round: { include: { tournament: { select: { name: true } } } },
          },
        },
      },
      orderBy: { match: { scheduledAt: "asc" } },
    });

    const matches = assignments.map((a) => ({
      id: a.matchId,
      time: a.match.scheduledAt?.toISOString() || null,
      field: a.match.field?.name || "Campo por definir",
      home: a.match.homeTeam?.name || "Por definir",
      away: a.match.awayTeam?.name || "Por definir",
      tournament: a.match.round.tournament.name,
      status: a.match.status.toLowerCase(),
      assignmentStatus: a.status,
    }));

    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({ error: "No se pudo obtener el horario" });
  }
}
```

**Step 4: Create `src/pages/api/referee/earnings.ts`**

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
    return payload.userId;
  } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const assignments = await prisma.refereeAssignment.findMany({
      where: { refereeId: userId, fee: { not: null } },
      select: { fee: true, paid: true },
    });

    const total = assignments.reduce((s, a) => s + Number(a.fee || 0), 0);
    const paid = assignments.filter((a) => a.paid).reduce((s, a) => s + Number(a.fee || 0), 0);
    const pending = total - paid;
    const totalMatches = await prisma.refereeAssignment.count({ where: { refereeId: userId } });

    return res.json({ total, paid, pending, totalMatches });
  } catch (err: any) {
    return res.status(500).json({ error: "No se pudo obtener las ganancias" });
  }
}
```

**Step 5: Commit**
```bash
git add src/pages/api/player/ src/pages/api/referee/
git commit -m "feat(api): add player stats, player tournaments, referee schedule/earnings endpoints"
```

---

## Task 3 — Wire Player Dashboard to real data

**Files:**
- Modify: `src/pages/dashboard/player.tsx`

Replace the file with this version that fetches real data and has loading skeletons + empty states:

```tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Trophy, Search, MapPin, DollarSign, Clock, Loader2 } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{sub}</p>
    </div>
  );
}

export default function PlayerDashboard() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("browse");

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [myTournaments, setMyTournaments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeTab === "browse") fetchTournaments();
    if (activeTab === "my") fetchMyTournaments();
    if (activeTab === "stats") fetchStats();
  }, [activeTab]);

  async function fetchTournaments() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/tournaments?status=ACTIVE&limit=20", { auth: false });
      setTournaments(data.tournaments || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyTournaments() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/player/tournaments");
      setMyTournaments(data.tournaments || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/player/stats");
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = tournaments.filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.fieldLocation?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "browse", label: "Explorar" },
    { id: "my", label: "Mis Torneos" },
    { id: "stats", label: "Mis Stats" },
  ];

  const typeLabel = (t: string) => t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos+Elim" : "Swiss";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Jugador</p>
          </div>
          <span className="text-yellow-400 text-2xl">⚽</span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-2">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {activeTab === "browse" && (
          <>
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar torneos, equipos, campos..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg">Torneos disponibles</h2>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
              ) : filtered.length === 0 ? (
                <EmptyState icon="🏆" title="No hay torneos disponibles" sub={search ? "Intenta con otra búsqueda" : "Los torneos activos aparecerán aquí"} />
              ) : (
                filtered.map((t: any) => (
                  <div key={t.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy size={16} className="text-yellow-400 shrink-0" />
                          <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">{typeLabel(t.type)}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 truncate">{t.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-400 text-sm">
                          {t.fieldLocation && <span className="flex items-center gap-1"><MapPin size={14} />{t.fieldLocation}</span>}
                          {t.startDate && <span className="flex items-center gap-1"><Clock size={14} />{new Date(t.startDate).toLocaleDateString("es-MX")}</span>}
                          <span className="flex items-center gap-1"><DollarSign size={14} />{Number(t.regFee).toLocaleString("es-MX")} {t.currency}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert("Inscripción disponible próximamente")}
                        className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold transition-all text-sm">
                        Inscribirse
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "my" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg">Mis Torneos</h2>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : myTournaments.length === 0 ? (
              <EmptyState icon="⚽" title="Aún no estás en ningún torneo" sub="Explora torneos disponibles e inscríbete con tu equipo" />
            ) : (
              myTournaments.map((t: any) => (
                <div key={t.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                  <h3 className="text-white font-bold text-lg">{t.name}</h3>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${t.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : t.status === "COMPLETED" ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {t.status === "ACTIVE" ? "🟢 Activo" : t.status === "COMPLETED" ? "✅ Completado" : "📋 Por iniciar"}
                    </span>
                    <span className="text-gray-400 text-sm">Equipo: <span className="text-white">{t.teamName}</span></span>
                    {t.isCaptain && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Capitán</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.matches}</div>
                  <div className="text-gray-400 text-sm">Partidos</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.goals}</div>
                  <div className="text-gray-400 text-sm">Goles</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.assists}</div>
                  <div className="text-gray-400 text-sm">Asistencias</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.redCards}</div>
                  <div className="text-gray-400 text-sm">Rojas</div>
                </div>
              </div>
            ) : (
              <EmptyState icon="📊" title="Aún sin estadísticas" sub="Juega en torneos para acumular estadísticas" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 6: Commit**
```bash
git add src/pages/dashboard/player.tsx
git commit -m "feat(player): wire real API data, add loading skeletons and empty states"
```

---

## Task 4 — Wire Referee Dashboard to real data

**Files:**
- Modify: `src/pages/dashboard/referee.tsx`

Replace with version that fetches from `/api/referee/schedule` and `/api/referee/earnings`:

```tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Clock, DollarSign, ClipboardList, TrendingUp, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function RefereeDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("today");
  const [matches, setMatches] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeTab === "today") fetchMatches();
    if (activeTab === "earnings" || activeTab === "stats") fetchEarnings();
  }, [activeTab]);

  async function fetchMatches() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/referee/schedule");
      setMatches(data.matches || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEarnings() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/referee/earnings");
      setEarnings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "today", label: "Hoy", icon: <Clock size={16} /> },
    { id: "history", label: "Historial", icon: <ClipboardList size={16} /> },
    { id: "earnings", label: "Ganancias", icon: <DollarSign size={16} /> },
    { id: "stats", label: "Estadísticas", icon: <TrendingUp size={16} /> },
  ];

  const formatTime = (iso: string | null) => {
    if (!iso) return "Hora por definir";
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-yellow-950 to-gray-950">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Árbitro</p>
          </div>
          <span className="text-yellow-400 text-2xl">🟨</span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-2">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-yellow-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {activeTab === "today" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg mb-4">
              {loading ? "Cargando partidos..." : `Partidos de hoy (${matches.length})`}
            </h2>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />)
            ) : matches.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-white font-semibold mb-1">Sin partidos hoy</h3>
                <p className="text-gray-400 text-sm">Revisa mañana o contacta al organizador</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-yellow-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-yellow-400 text-sm font-mono">{formatTime(match.time)}</span>
                    <span className={`text-xs px-2 py-1 rounded ${match.status === "in_progress" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {match.status === "in_progress" ? "⏱ En juego" : "📋 Programado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{match.home}</div>
                      <div className="text-gray-500 text-sm">local</div>
                    </div>
                    <div className="text-gray-400 font-bold">VS</div>
                    <div className="text-right">
                      <div className="text-white font-bold">{match.away}</div>
                      <div className="text-gray-500 text-sm">visitante</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={14} />{match.field}</span>
                    <span>{match.tournament}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => toast.success("Asistencia confirmada")}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-semibold transition-all text-sm">
                      Confirmar asistencia
                    </button>
                    <button
                      onClick={() => toast.info("Detalle de partido — próximamente")}
                      className="bg-white/5 hover:bg-white/10 text-white py-2 px-4 rounded-lg transition-all text-sm border border-white/10">
                      Detalles
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Historial de arbitrajes</h3>
            <p className="text-gray-400">
              {earnings ? `${earnings.totalMatches} partidos arbitrados en total` : "Cargando..."}
            </p>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : earnings ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
                    <DollarSign size={24} className="mx-auto text-green-400 mb-2" />
                    <div className="text-2xl font-bold text-white">${earnings.total.toLocaleString("es-MX")}</div>
                    <div className="text-gray-400 text-sm">Total ganado</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 text-center">
                    <DollarSign size={24} className="mx-auto text-yellow-400 mb-2" />
                    <div className="text-2xl font-bold text-white">${earnings.pending.toLocaleString("es-MX")}</div>
                    <div className="text-gray-400 text-sm">Pendiente</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 text-center">
                    <DollarSign size={24} className="mx-auto text-blue-400 mb-2" />
                    <div className="text-2xl font-bold text-white">${earnings.paid.toLocaleString("es-MX")}</div>
                    <div className="text-gray-400 text-sm">Pagado</div>
                  </div>
                </div>
                {earnings.pending === 0 ? (
                  <p className="text-gray-400 text-sm text-center">Sin pagos pendientes</p>
                ) : (
                  <button
                    onClick={() => toast.info("Retiro SPEI — próximamente")}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-semibold transition-all">
                    Solicitar retiro SPEI — ${earnings.pending.toLocaleString("es-MX")}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400">No se pudo cargar las ganancias</div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            {loading ? (
              <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : earnings ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-white">{earnings.totalMatches}</div>
                  <div className="text-gray-400 text-sm">Total partidos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-400">—</div>
                  <div className="text-gray-400 text-sm">Rating promedio</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">${earnings.total.toLocaleString("es-MX")}</div>
                  <div className="text-gray-400 text-sm">Ganancias totales</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">No se pudo cargar las estadísticas</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 7: Commit**
```bash
git add src/pages/dashboard/referee.tsx
git commit -m "feat(referee): wire real schedule/earnings APIs, loading states, empty states"
```

---

## Task 5 — Wire Organizer Dashboard + TournamentCreate real API

**Files:**
- Modify: `src/components/tournament-create.tsx`
- Modify: `src/pages/dashboard/organizer.tsx`
- Modify: `src/components/financial-dashboard.tsx`
- Modify: `src/components/team-list.tsx`
- Modify: `src/components/bracket-view.tsx`

### 5a: Fix TournamentCreate — real API call + success reset

```tsx
import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function TournamentCreate({ onCreated }: { onCreated?: (t: any) => void }) {
  const [form, setForm] = useState({
    name: "",
    type: "KNOCKOUT",
    maxTeams: 16,
    startDate: "",
    regFee: 500,
    currency: "MXN",
    fieldLocation: "",
    fieldAddress: "",
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (form.maxTeams < 2) e.maxTeams = "Mínimo 2 equipos";
    if (form.regFee < 0) e.regFee = "El costo no puede ser negativo";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await api("/api/tournaments", {
        method: "POST",
        body: JSON.stringify({ ...form, status: "DRAFT" }),
      });
      toast.success("¡Torneo creado!");
      setForm({ name: "", type: "KNOCKOUT", maxTeams: 16, startDate: "", regFee: 500, currency: "MXN", fieldLocation: "", fieldAddress: "", isPublic: true });
      onCreated?.(data.tournament);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el torneo");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof errors) =>
    errors[key] ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500";

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h2 className="text-white font-bold text-lg mb-4">Crear Nuevo Torneo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre del torneo *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${field("name")}`}
              placeholder="Ej: Torneo Barrenderos CDMX" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Tipo de torneo *</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
              <option value="KNOCKOUT">Eliminatoria</option>
              <option value="LEAGUE">Liga</option>
              <option value="GROUPS">Grupos + Eliminatoria</option>
              <option value="SWISS">Swiss</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Máximo de equipos</label>
            <input type="number" min={2} max={128} value={form.maxTeams} onChange={(e) => setForm({ ...form, maxTeams: parseInt(e.target.value) || 2 })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${field("maxTeams")}`} />
            {errors.maxTeams && <p className="text-red-400 text-xs mt-1">{errors.maxTeams}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Fecha de inicio</label>
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Costo de inscripción</label>
            <input type="number" min={0} value={form.regFee} onChange={(e) => setForm({ ...form, regFee: parseFloat(e.target.value) || 0 })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none ${field("regFee")}`} />
            {errors.regFee && <p className="text-red-400 text-xs mt-1">{errors.regFee}</p>}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Moneda</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
              <option value="MXN">MXN — Peso Mexicano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Ubicación del campo</label>
            <input type="text" value={form.fieldLocation} onChange={(e) => setForm({ ...form, fieldLocation: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Nombre del campo" />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Dirección del campo</label>
            <input type="text" value={form.fieldAddress} onChange={(e) => setForm({ ...form, fieldAddress: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Calle, colonia, ciudad" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50">
          {loading ? "Creando..." : "Crear Torneo"}
        </button>
      </form>
    </div>
  );
}
```

### 5b: Organizer Dashboard — add tournament list tab, pass onCreated

```tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { TournamentCreate } from "@/components/tournament-create";
import { TeamList } from "@/components/team-list";
import { BracketView } from "@/components/bracket-view";
import { FinancialDashboard } from "@/components/financial-dashboard";
import { Users, Trophy, DollarSign, ClipboardList, BarChart3, Plus } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function OrganizerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("tournaments");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "tournaments", label: "Torneos", icon: <Trophy size={18} /> },
    { id: "teams", label: "Equipos", icon: <Users size={18} /> },
    { id: "brackets", label: "Cuadros", icon: <ClipboardList size={18} /> },
    { id: "financial", label: "Finanzas", icon: <DollarSign size={18} /> },
    { id: "analytics", label: "Métricas", icon: <BarChart3 size={18} /> },
  ];

  useEffect(() => {
    if (activeTab === "tournaments") fetchTournaments();
  }, [activeTab]);

  async function fetchTournaments() {
    setLoading(true);
    try {
      const data = await api("/api/tournaments?status=DRAFT&limit=50");
      const data2 = await api("/api/tournaments?status=ACTIVE&limit=50");
      setTournaments([...(data.tournaments || []), ...(data2.tournaments || [])]);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  const typeLabel = (t: string) => t === "KNOCKOUT" ? "Eliminatoria" : t === "LEAGUE" ? "Liga" : t === "GROUPS" ? "Grupos" : "Swiss";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Hola, {user?.name}</h1>
            <p className="text-gray-400 text-sm">Panel de Organizador</p>
          </div>
          <span className="text-yellow-400">👔</span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-2">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {activeTab === "tournaments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Mis Torneos</h2>
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm">
                <Plus size={16} /> {showCreate ? "Cancelar" : "Nuevo Torneo"}
              </button>
            </div>
            {showCreate && (
              <TournamentCreate onCreated={(t) => { setTournaments((prev) => [t, ...prev]); setShowCreate(false); }} />
            )}
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : tournaments.length === 0 && !showCreate ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <Trophy size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-white font-semibold mb-1">Aún no tienes torneos</h3>
                <p className="text-gray-400 text-sm mb-4">Crea tu primer torneo para comenzar</p>
                <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                  Crear primer torneo
                </button>
              </div>
            ) : (
              tournaments.map((t: any) => (
                <div key={t.id}
                  onClick={() => setSelectedTournament(t)}
                  className={`bg-white/5 backdrop-blur-xl rounded-2xl p-5 border transition-all cursor-pointer ${selectedTournament?.id === t.id ? "border-blue-500/50" : "border-white/10 hover:border-white/20"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold">{t.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span>{typeLabel(t.type)}</span>
                        <span>Max {t.maxTeams} equipos</span>
                        {t.startDate && <span>{new Date(t.startDate).toLocaleDateString("es-MX")}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${t.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "teams" && <TeamList tournamentId={selectedTournament?.id} />}
        {activeTab === "brackets" && <BracketView tournamentId={selectedTournament?.id} />}
        {activeTab === "financial" && <FinancialDashboard tournamentId={selectedTournament?.id} />}
        {activeTab === "analytics" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Métricas del Torneo</h3>
            <p className="text-gray-400">{selectedTournament ? "Próximamente" : "Selecciona un torneo primero"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5c: TeamList — accept tournamentId, real data with empty state + add team form that works

```tsx
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function TeamList({ tournamentId }: { tournamentId?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", colorHex: "#3B82F6" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (tournamentId) fetchTeams();
    else setTeams([]);
  }, [tournamentId]);

  async function fetchTeams() {
    setLoading(true);
    try {
      const data = await api(`/api/tournaments/${tournamentId}/teams`);
      setTeams(data.teams || []);
    } catch { setTeams([]); }
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("El nombre es obligatorio"); return; }
    if (!tournamentId) { toast.error("Selecciona un torneo primero"); return; }
    setSaving(true);
    setFormError("");
    try {
      const data = await api(`/api/tournaments/${tournamentId}/teams`, {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), colorHex: form.colorHex, payAmount: 0 }),
      });
      setTeams((prev) => [...prev, data.team]);
      setForm({ name: "", colorHex: "#3B82F6" });
      setShowForm(false);
      toast.success("Equipo registrado");
    } catch (err: any) {
      setFormError(err.message || "Error al registrar el equipo");
    } finally {
      setSaving(false);
    }
  }

  const colors = [
    { hex: "#3B82F6", label: "🔵" }, { hex: "#EF4444", label: "🔴" },
    { hex: "#10B981", label: "🟢" }, { hex: "#F59E0B", label: "🟡" },
    { hex: "#8B5CF6", label: "🟣" }, { hex: "#F97316", label: "🟠" },
  ];

  if (!tournamentId) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <Users size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Selecciona un torneo</h3>
        <p className="text-gray-400 text-sm">Ve a la pestaña Torneos y selecciona uno para gestionar sus equipos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Equipos{teams.length > 0 ? ` (${teams.length})` : ""}</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm">
          <Plus size={16} /> Nuevo Equipo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-white font-semibold">Registrar Equipo</h3>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div>
            <label className="text-gray-300 text-sm block mb-1">Nombre del equipo *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Ej: Los Gallos" />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Color del equipo</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button key={c.hex} type="button" onClick={() => setForm({ ...form, colorHex: c.hex })}
                  className={`w-10 h-10 rounded-full text-lg flex items-center justify-center transition-all ${form.colorHex === c.hex ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
                  style={{ backgroundColor: c.hex }}>
                  {form.colorHex === c.hex ? "✓" : ""}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50">
              {saving ? "Guardando..." : "Registrar"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError(""); }}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-lg transition-all">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
      ) : teams.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
          <Users size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-white font-semibold mb-1">Sin equipos registrados</h3>
          <p className="text-gray-400 text-sm">Agrega el primer equipo para comenzar el torneo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((team: any) => (
            <div key={team.id} className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.colorHex || "#3B82F6" }}>
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{team.name}</div>
                    {team.captain && <div className="text-gray-400 text-sm">Capitán: {team.captain.name}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-gray-400 text-sm"><Users size={14} />{team.playersCount}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    team.payStatus === "PAID" ? "bg-green-500/20 text-green-400" :
                    team.payStatus === "PARTIAL" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {team.payStatus === "PAID" ? "✓ Pagado" : team.payStatus === "PARTIAL" ? "⏳ Parcial" : "❌ Pendiente"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5d: BracketView — accept tournamentId, show empty state when no tournament

```tsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Clock, ClipboardList } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function BracketView({ tournamentId }: { tournamentId?: string }) {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournamentId) fetchBracket();
    else setRounds([]);
  }, [tournamentId]);

  async function fetchBracket() {
    setLoading(true);
    try {
      const data = await api(`/api/tournaments/${tournamentId}/bracket`);
      setRounds(data.rounds || []);
    } catch { setRounds([]); }
    finally { setLoading(false); }
  }

  if (!tournamentId) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Selecciona un torneo</h3>
        <p className="text-gray-400 text-sm">Ve a Torneos y selecciona uno para ver su cuadro</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h2 className="text-white font-bold text-lg mb-4">Cuadro del Torneo</h2>
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : rounds.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList size={40} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">El bracket se generará cuando se cierren las inscripciones</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="space-y-8 min-w-[320px]">
            {rounds.map((round: any, rIdx: number) => (
              <div key={rIdx}>
                <h3 className="text-blue-300 text-sm font-semibold mb-3 uppercase tracking-wider">
                  {round.bracketType || `Ronda ${round.roundNum}`}
                </h3>
                <div className="space-y-3">
                  {(round.matches || []).map((match: any, mIdx: number) => (
                    <div key={mIdx} className={`bg-white/5 rounded-xl p-4 border ${match.status === "COMPLETED" ? "border-green-500/30" : "border-white/10"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className={`font-semibold ${match.homeScore !== null && match.homeScore > (match.awayScore || 0) ? "text-white" : "text-gray-300"}`}>
                            {match.homeTeam?.name || "Por definir"}
                          </div>
                          <div className={`font-semibold ${match.awayScore !== null && match.awayScore > (match.homeScore || 0) ? "text-white" : "text-gray-300"}`}>
                            {match.awayTeam?.name || "Por definir"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white w-8 text-center">{match.homeScore ?? "–"}</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-2xl font-bold text-white w-8 text-center">{match.awayScore ?? "–"}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <Clock size={12} />
                        {match.status === "COMPLETED" ? "Finalizado" :
                         match.scheduledAt ? new Date(match.scheduledAt).toLocaleString("es-MX") : "Próximo partido"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5e: FinancialDashboard — accept tournamentId, fetch from real API

```tsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DollarSign, TrendingUp, CreditCard, BarChart3 } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function FinancialDashboard({ tournamentId }: { tournamentId?: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournamentId) fetchFinancials();
    else setSummary(null);
  }, [tournamentId]);

  async function fetchFinancials() {
    setLoading(true);
    try {
      const data = await api(`/api/tournaments/${tournamentId}/financials`);
      setSummary(data);
    } catch { setSummary(null); }
    finally { setLoading(false); }
  }

  const fmt = (n: number) => `$${Number(n || 0).toLocaleString("es-MX")}`;

  if (!tournamentId) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <DollarSign size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Selecciona un torneo</h3>
        <p className="text-gray-400 text-sm">Ve a Torneos y selecciona uno para ver sus finanzas</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-white font-semibold mb-1">Sin datos financieros</h3>
        <p className="text-gray-400 text-sm">Los datos aparecerán cuando haya pagos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <TrendingUp size={20} className="text-green-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.totalIncome)}</div>
          <div className="text-gray-400 text-sm">Ingresos totales</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <CreditCard size={20} className="text-yellow-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.pendingIncome)}</div>
          <div className="text-gray-400 text-sm">Pendiente</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <BarChart3 size={20} className="text-red-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.totalExpenses)}</div>
          <div className="text-gray-400 text-sm">Gastos</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <DollarSign size={20} className="text-blue-400 mb-2" />
          <div className="text-white font-bold text-lg">{fmt(summary.netIncome)}</div>
          <div className="text-gray-400 text-sm">Ganancia neta</div>
        </div>
      </div>

      {summary.payments?.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Pagos recibidos</h3>
            <span className="text-gray-400 text-sm">{summary.teamsPaid} pagados · {summary.teamsPending} pendientes</span>
          </div>
          <div className="space-y-2">
            {summary.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-white text-sm font-semibold">{p.team?.name || "—"}</div>
                  <div className="text-gray-500 text-xs">{p.method}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">{fmt(p.amount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {p.status === "COMPLETED" ? "✓ Recibido" : "⏳ Pendiente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 8: Commit**
```bash
git add src/components/ src/pages/dashboard/organizer.tsx
git commit -m "feat(organizer): wire real tournament list/create, teams, bracket, financial with empty states"
```

---

## Task 6 — New tournament sub-routes (teams + bracket + financials)

**Files:**
- Create: `src/pages/api/tournaments/[id]/teams.ts`
- Create: `src/pages/api/tournaments/[id]/bracket.ts`
- Create: `src/pages/api/tournaments/[id]/financials.ts`

### `src/pages/api/tournaments/[id]/teams.ts`

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try { return (jwt.verify(auth.split(" ")[1], JWT_SECRET) as any).userId; }
  catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    try {
      const teams = await prisma.team.findMany({
        where: { tournamentId: id },
        include: { captain: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      });
      return res.json({ teams });
    } catch { return res.status(500).json({ error: "No se pudo obtener los equipos" }); }
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { name, colorHex, payAmount } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
      const team = await prisma.team.create({
        data: { tournamentId: id, name: name.trim(), colorHex, payAmount: parseFloat(payAmount) || 0 },
      });
      return res.json({ team });
    } catch (err: any) {
      if (err.code === "P2002") return res.status(409).json({ error: "Ya existe un equipo con ese nombre en este torneo" });
      return res.status(500).json({ error: "No se pudo crear el equipo" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
```

### `src/pages/api/tournaments/[id]/bracket.ts`

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query as { id: string };
  try {
    const rounds = await prisma.bracketRound.findMany({
      where: { tournamentId: id },
      orderBy: { roundNum: "asc" },
      include: {
        matches: {
          include: {
            homeTeam: { select: { name: true, colorHex: true } },
            awayTeam: { select: { name: true, colorHex: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return res.json({ rounds });
  } catch { return res.status(500).json({ error: "No se pudo obtener el bracket" }); }
}
```

### `src/pages/api/tournaments/[id]/financials.ts`

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try { return (jwt.verify(auth.split(" ")[1], JWT_SECRET) as any).userId; }
  catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.query as { id: string };

  try {
    const payments = await prisma.payment.findMany({
      where: { tournamentId: id },
      include: { team: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const completed = payments.filter((p) => p.status === "COMPLETED");
    const pending = payments.filter((p) => p.status !== "COMPLETED");
    const totalIncome = completed.reduce((s, p) => s + Number(p.amount), 0);
    const pendingIncome = pending.reduce((s, p) => s + Number(p.amount), 0);

    const teams = await prisma.team.findMany({ where: { tournamentId: id }, select: { payStatus: true } });
    const teamsPaid = teams.filter((t) => t.payStatus === "PAID").length;
    const teamsPending = teams.filter((t) => t.payStatus !== "PAID").length;

    return res.json({
      totalIncome,
      pendingIncome,
      totalExpenses: 0,
      netIncome: totalIncome,
      teamsPaid,
      teamsPending,
      payments,
    });
  } catch { return res.status(500).json({ error: "No se pudo obtener las finanzas" }); }
}
```

**Step 9: Commit**
```bash
git add src/pages/api/tournaments/
git commit -m "feat(api): tournament sub-routes: teams CRUD, bracket read, financials"
```

---

## Task 7 — Mobile bracket overflow + sanitize API errors + delete dead file

**Files:**
- Delete: `src/stores/auth.ts`
- Modify: `src/pages/api/auth/register.ts` (map Prisma unique errors)
- Modify: `src/pages/api/auth/login.ts` (map Prisma errors)

### 7a: Delete dead duplicate

```bash
rm src/stores/auth.ts
```

### 7b: Sanitize register.ts errors

```ts
// In the catch block, replace:
return res.status(500).json({ error: err.message || "Registration failed" });
// with:
if (err.code === "P2002") {
  const field = err.meta?.target?.includes("email") ? "email" : "teléfono";
  return res.status(409).json({ error: `Ya existe una cuenta con ese ${field}` });
}
return res.status(500).json({ error: "Error al crear la cuenta" });
```

### 7c: Sanitize login.ts errors

```ts
// In the catch block, replace:
return res.status(500).json({ error: err.message || "Login failed" });
// with:
return res.status(500).json({ error: "Error al iniciar sesión" });
```

### 7d: Sanitize tournaments/index.ts errors

```ts
// In the POST catch block, replace:
return res.status(500).json({ error: err.message });
// with:
if (err.code === "P2002") return res.status(409).json({ error: "Ya existe un torneo con ese nombre" });
return res.status(500).json({ error: "Error al crear el torneo" });
```

**Step 10: Commit**
```bash
git add -A
git commit -m "fix: sanitize API error messages, delete dead stores/auth.ts duplicate"
```

---

## Task 8 — Final: build check + push to main

```bash
npm run build
# Expect: ✓ Compiled successfully

git push origin main
```

---

## Notes

- The `api()` helper in `src/lib/api.ts` auto-attaches the JWT token. Always use it for authenticated routes instead of raw `fetch`.
- Tournament sub-routes use dynamic route syntax: `src/pages/api/tournaments/[id]/teams.ts` → `/api/tournaments/{id}/teams`.
- "Inscribirse" button in player dashboard currently shows `alert()` — that's intentional as a placeholder for the full payment flow.
- The bracket `overflow-x-auto` wrapper is inside `BracketView` on the rounds container (Task 5d) — no separate task needed.
- All `Skeleton` components are defined inline per file (copy-paste pattern) to avoid creating unnecessary shared components.
