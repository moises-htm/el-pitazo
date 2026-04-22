# UI Redesign — Premium Mobile-First Design Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply sleek glassmorphism dark-theme design system across all El Pitazo pages — bottom nav, sticky header, animations, gradient cards, premium native-app feel.

**Architecture:** Add animation utilities + `.glass` class to globals.css; create reusable BottomNav + AppHeader components wired into _app.tsx; apply consistent glassmorphism + neon-green accent system to all 10 pages.

**Tech Stack:** Next.js, Tailwind CSS, Lucide React, Zustand auth store

---

### Task 1: globals.css — Animation utilities

**Files:**
- Modify: `src/styles/globals.css`

Add fadeInUp, slideIn, pulse-glow keyframes + utility classes + `.glass` shorthand.

---

### Task 2: BottomNav component + AppHeader component

**Files:**
- Create: `src/components/bottom-nav.tsx`
- Create: `src/components/app-header.tsx`

BottomNav: 5 tabs (Home→/, Torneos→/dashboard, Feed→/feed, Chat→/chat, Perfil→/settings/notifications), green-500 active, gray-500 inactive, backdrop-blur-xl bg-gray-900/80.

AppHeader: sticky top, "El Pitazo" + avatar initial, glassmorphism style.

---

### Task 3: _app.tsx — Wire BottomNav + AppHeader

**Files:**
- Modify: `src/pages/_app.tsx`

Show BottomNav + AppHeader only when user is logged in (useAuthStore). Move install banner above bottom nav (z-index 60). Wrap Component in div with `pb-20` when logged in.

---

### Task 4: Landing page (index.tsx)

**Files:**
- Modify: `src/pages/index.tsx`

Add animate-fade-in-up to sections, gradient animated hero background layer, glow effect on CTA buttons (animate-pulse-glow), floating ⚽ decorative elements, upgrade role cards to rounded-2xl with gradient borders.

---

### Task 5: Auth pages (login.tsx + register.tsx)

**Files:**
- Modify: `src/pages/auth/login.tsx`
- Modify: `src/pages/auth/register.tsx`

Already solid — enhance right panel with .glass card wrapper, add animate-fade-in-up to form, upgrade buttons to active:scale-95 transition-transform.

---

### Task 6: Player Dashboard (player.tsx)

**Files:**
- Modify: `src/pages/dashboard/player.tsx`

Stat cards with gradient-border glow, tab bar with animated underline indicator, rounded-2xl cards, hover:scale-[1.02] on tournament cards.

---

### Task 7: Organizer Dashboard (organizer.tsx)

**Files:**
- Modify: `src/pages/dashboard/organizer.tsx`

Glassmorphism card wrappers for tournament list, gradient header banner, pill-style tab navigation, data visualization card frames.

---

### Task 8: Referee Dashboard (referee.tsx)

**Files:**
- Modify: `src/pages/dashboard/referee.tsx`

Match cards with colored status badges (PENDIENTE/ACTIVO/COMPLETADO), earnings summary card with green gradient accent.

---

### Task 9: Feed (feed.tsx)

**Files:**
- Modify: `src/pages/feed.tsx`

Instagram-style full-width video cards with rounded-2xl, floating action button for upload (fixed bottom-right), like/comment actions row, glassmorphism overlay for username/caption.

---

### Task 10: Chat (chat.tsx)

**Files:**
- Modify: `src/pages/chat.tsx`

WhatsApp-style own messages in neon-green/dark, other messages in glass card, rounded-2xl bubbles, smooth scroll animations, room list with avatar initials.
