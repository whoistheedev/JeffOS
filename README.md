# JeffOS

A vintage Mac-style web portfolio OS with emulator-based games. Experience a classic desktop interface with interactive apps, wallpapers, and real-time game leaderboards—all in the browser.

---

## 🎯 Features

- **Desktop & Dock UI:** Icon-only navigation; apps launch in resizable windows.
- **Emulator Games:** Play retro games in-browser; live leaderboards (Top-10 Today / All-Time) with anti-cheat.
- **Guestbook:** Auto-published, with profanity masking and rate-limiting.
- **Wallpapers & Themes:** Visitor wallpaper persists locally; default theme stored in Supabase DB.
- **Spotlight Search:** Fast keyboard-driven search across apps.
- **A11y & Performance:** Lighthouse ≥95, smooth 60fps windowing, reduced-motion support.

---

## 🛠 Tech Stack

- **Frontend:** React 18 + Vite + TypeScript, TailwindCSS, shadcn/ui, framer-motion, dnd-kit, react-rnd
- **State & Data:** Zustand, TanStack Query
- **Backend:** Supabase (Postgres, Storage, Realtime, Edge Functions)
- **Deployment:** Vercel Edge
- **Identity:** Anonymous users with `anonId`, `handle`, `avatar` in localStorage

---

## ⚡ Getting Started

1. Clone the repo:
```bash
git clone https://github.com/<username>/JeffOS.git
cd JeffOS
