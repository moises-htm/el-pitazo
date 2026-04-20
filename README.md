# ⚽ EL PITAZO

## The complete app for amateur soccer tournaments

**3 roles, 1 app, infinite tournaments.**

---

## 🎯 ¿Qué es El Pitazo?

Una sola app (iPhone + Android) con 3 interfaces según tu rol:

| Rol | App | Funciones |
|-----|-----|----------|
| ⚽ **Jugador** | Panel de Jugador | Explorar torneos, inscribirse, ver bracket en vivo, stats personales |
| 🟨 **Árbitro** | Panel de Árbitro | Dashboard del día, anotar en vivo, validar identidad, enviar actas, recibir pagos |
| 👔 **Organizador** | Panel de Organizador | Crear torneos, cobrar inscripciones, gestionar equipos, generar brackets, ver finanzas |

**Todo conectado en tiempo real** vía WebSocket. Lo que pasa en el campo se refleja al instante.

---

## 📁 Estructura del proyecto

```
el-pitazo/
├── src/
│   ├── pages/
│   │   ├── index.tsx           → Pantalla de bienvenida (selector de rol)
│   │   ├── _app.tsx            → Layout principal + Toaster
│   │   ├── auth/
│   │   │   ├── register.tsx    → Registro con selección de rol
│   │   │   └── login.tsx       → Login (email/teléfono + contraseña)
│   │   └── dashboard/
│   │       ├── index.tsx       → Router condicional según rol
│   │       ├── organizer.tsx   → Dashboard del organizador
│   │       ├── player.tsx      → Dashboard del jugador
│   │       └── referee.tsx     → Dashboard del árbitro
│   ├── components/
│   │   ├── tournament-create.tsx   → Formulario crear torneo
│   │   ├── bracket-view.tsx        → Visualización del cuadro
│   │   ├── team-list.tsx           → Lista de equipos
│   │   └── financial-dashboard.tsx → Dashboard financiero
│   ├── stores/
│   │   └── auth.ts             → Zustand store (auth + user state)
│   └── styles/
│       └── globals.css         → Tailwind + custom styles
├── backend/
│   ├── server.js               → Express + Socket.IO server
│   ├── config/
│   │   └── env.js              → Configuración de variables
│   ├── middleware/
│   │   └── auth.js             → JWT middleware de autenticación
│   └── routes/
│       ├── auth.js             → POST /register, /login, /me
│       ├── tournaments.js      → CRUD torneos + bracket generation
│       ├── teams.js            → CRUD equipos + miembros
│       ├── matches.js          → Match status, scores, standings
│       ├── payments.js         → Stripe + MercadoPago + OXXO
│       ├── referees.js         → Asignación + historial + ganancias
│       ├── media.js            → Upload de fotos/videos
│       └── analytics.js        → Métricas del torneo
├── prisma/
│   └── schema.prisma           → Base de datos (12 tablas)
├── .env.example                → Variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── postcss.config.js
└── README.md
```

---

## 🚀 Cómo correr

### 1. Instalar dependencias
```bash
cd el-pitazo
npm install
```

### 2. Configurar base de datos
```bash
# Crear DB PostgreSQL (o usar Supabase)
psql -U postgres -c "CREATE DATABASE el_pitazo;"

# Generar cliente Prisma
npx prisma generate
npx prisma db push
```

### 3. Crear archivo .env
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Correr en desarrollo
```bash
# Terminal 1 — Backend
npm run server

# Terminal 2 — Frontend
npm run dev
```

**El frontend corre en:** http://localhost:3000
**El API corre en:** http://localhost:3001

---

## 📱 La App (1 sola app — 3 roles)

### Pantalla de bienvenida
```
┌─── ──────────────────────── ──────┐
│          ⚽ EL PITAZO              │
│    La app que organiza tu torneo  │
│                                   │
│  ¿Cómo quieres usar El Pitazo?    │
│                                   │
│  [ ⚽  Jugador ]                   │
│  [ 🟨  Árbitro  ]                 │
│  [ 👔  Organizador ]              │
│                                   │
│  Ya tengo cuenta                  │
│  [ Iniciar Sesión ]               │
└─── ──────────────────────── ──────┘
```

### Panel del Organizador
- Crear torneo (tipo, campos, fechas, reglas)
- Registrar equipos (nombre, capitán, color)
- Generar brackets automáticos (eliminatoria, grupos, Swiss)
- Cobrar inscripciones (Stripe, SPEI, Oxxo, MercadoPago)
- Dashboard financiero en tiempo real
- Métricas del torneo (equipos, inscripciones, ingresos)

### Panel del Jugador
- Explorar torneos disponibles (búsqueda por ubicación, precio, nivel)
- Inscribirse con un tap
- Pagar con tarjeta/SPEI/Oxxo
- Ver bracket en tiempo real
- Estadísticas personales (goles, asistencias, tarjetas)
- Buscar equipos que necesitan jugadores

### Panel del Árbitro
- "Hoy arbitro 3 partidos" — horarios, canchas, equipos
- Anotar goles, tarjetas, sustituciones en vivo
- Validar identidad de jugadores (escanear cédula)
- Enviar acta post-partido con un tap
- Ver saldo y solicitar retiro SPEI
- Rating de organizadores

---

## 🗄️ Base de datos (12 tablas)

- **users** — Usuarios (pueden tener múltiples roles)
- **tournaments** — Torneos (liga, eliminatoria, grupos, Swiss)
- **fields** — Campos de juego
- **teams** — Equipos (con color, logo, nivel)
- **team_members** — Jugadores por equipo
- **bracket_rounds** — Rondas del bracket
- **bracket_matches** — Partidos del bracket
- **match_events** — Eventos del partido (goles, tarjetas, sustituciones)
- **payments** — Pagos (Stripe, MercadoPago, SPEI, Oxxo)
- **referee_assignments** — Asignación de árbitros
- **referee_reports** — Reportes post-partido
- **notifications** — Notificaciones push/SMS/WhatsApp
- **tournament_media** — Fotos y videos del torneo
- **sponsors** — Patrocinadores
- **tournament_analytics** — Métricas del torneo

---

## 💳 Pagos

### Integraciones
- **Stripe** — Tarjetas de crédito/débito (USA)
- **MercadoPago** — SPEI, Oxxo, tarjetas (LATAM)
- **Oxxo** — Vales de depósito
- **Efectivo** — Registrar pagos en persona

### Métodos por región
| Región | Métodos disponibles |
|--------|-------------------|
| México | SPEI, Oxxo, tarjeta, efectivo |
| USA | Stripe (cards), PayPal |
| Colombia | PSE, tarjetas, efectivo |
| España | SEPA, tarjetas |

---

## 🔐 Autenticación

- Email + contraseña (bcrypt)
- Teléfono + contraseña
- Google Sign-In (próximo)
- JWT tokens (7 días de expiración)
- Middleware de autenticación en todas las rutas protegidas

---

## 🌐 WebSocket (tiempo real)

- Score updates → todos los participantes ven el marcador en tiempo real
- Bracket updates → avanza automáticamente cuando un match se completa
- Notification broadcasts → cambio de horario/cancha notifica a todos
- Tournament notifications → registro confirmado, pago recibido

---

## 📊 Bracket Engine

Soporta 4 tipos de torneo:
1. **LEAGUE** — Todos contra todos (round-robin)
2. **KNOCKOUT** — Eliminatoria simple
3. **GROUPS** — Grupos + eliminatoria
4. **SWISS** — Sistema suizo (equipes con record similar se enfrentan)

Algoritmo de seeding:
- Random (por defecto)
- Por ranking (si se proporciona)
- Por historial de torneos anteriores

Smart scheduling:
- Evita que un equipo juegue en dos campos a la misma vez
- Distribución equitativa de horarios
- Colisiones detectadas y resueltas automáticamente

---

## 🚦 Roadmap

### MVP ✅ (12 semanas)
- [x] Estructura del proyecto
- [x] Schema de base de datos
- [x] APIs de autenticación
- [x] CRUD de torneos
- [x] Generación de brackets
- [x] Dashboard del organizador
- [x] Dashboard del jugador
- [x] Dashboard del árbitro
- [x] Sistema de pagos (Stripe + MercadoPago)
- [x] WebSocket en tiempo real
- [ ] Integración con campos de prueba
- [ ] App Store submissions
- [ ] Primeros 30 torneos de prueba

### Post-MVP
- [ ] Free agents marketplace (jugadores buscando equipos)
- [ ] Mercado de árbitros (matchmaking automático)
- [ ] Seguro por partido (integración con aseguradoras)
- [ ] Integración con WhatsApp (notificaciones)
- [ ] Contenido social (fotos, highlights, compartir en IG)
- [ ] White-label para ligas grandes
- [ ] Transmisión en vivo
- [ ] Estadísticas avanzadas (xG, posesión)
- [ ] Multi-idioma (español, inglés, portugués)
- [ ] Sponsor dashboard (métricas para anunciantes)

---

## 🎨 Design System

- **Fondo:** gradiente dark blue (`#0a0a0a` → `#0f172a`)
- **Primario:** blue (`#2563eb` → `#3b82f6`)
- **Acentos:** yellow (árbitro), green (pagos), red (gastos)
- **Cards:** `bg-white/5` + `backdrop-blur-xl` + `border-white/10`
- **Tipografía:** Inter (sans-serif)
- **Border radius:** `rounded-xl` (components), `rounded-2xl` (cards)
- **Transiciones:** hover scale + color shifts

---

## 📦 Tecnologías

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Backend | Node.js + Express |
| State | Zustand |
| DB | PostgreSQL + Prisma ORM |
| Real-time | Socket.IO |
| Auth | JWT + bcrypt |
| Payments | Stripe + MercadoPago |
| Styles | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Toast | Sonner |
| Validation | Zod |
| Hosting | Vercel (frontend) + Railway (backend) |
| DB | Supabase (PostgreSQL) |

---

## 📄 Licencia

MIT — Código abierto

---

> **El Pitazo** — Porque ningún torneo debería organizarse con WhatsApp y Excel. ⚽
