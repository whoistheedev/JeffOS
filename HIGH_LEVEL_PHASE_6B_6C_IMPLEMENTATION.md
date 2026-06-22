# JeffOS — Phase 6B / 6C High-Level Implementation

> Principal Product Designer · Staff Frontend Architect · Senior UX Researcher · Platform Engineer.
> **Design only — no code, no implementation.** Builds on the existing architecture; nothing is redesigned from scratch.
> Authored 2026-06-21. Source of truth: this repository + the live Supabase project `akqqmrqeloasisiybdjx` + Jeffrey's real CV.
> Builds on: [PHASE_6_RECRUITER_MODE.md](PHASE_6_RECRUITER_MODE.md) · [PHASE_6_UI_UX_REDESIGN.md](PHASE_6_UI_UX_REDESIGN.md) · [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) · [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md) · [PHASE5_IMPLEMENTATION.md](PHASE5_IMPLEMENTATION.md)
> **Audience:** CTO review · Product review · long-term platform planning.

---

## ⚠️ Positioning truth (read first — governs §3, §4, §5, §13, §14)

The real CV is **Backend Engineer (4 yrs), HealthTech-focused, seeking part-time backend contracts (10–25 hrs/week)** — Node.js/Express, **Supabase (RLS/Auth/Storage/Edge)**, PostgreSQL, OCR+LLM pipelines, RBAC, secure file handling. Real projects: **Slippiggy** (OCR+LLM document pipeline) and a **Dev Tooling Suite**. **There is no EDI or RCM experience in the CV.**

Per explicit decision, **EDI / RCM / clinical-API / EHR-EMR are used as ASPIRATIONAL framing only** — always labeled as a *direction Jeffrey is targeting*, never implied as held experience. Everything in §14 (brand) and §3–§5 (case studies / showcase / insights) must keep verifiable CV facts in the foreground and clearly mark aspirational tracks as "targeting / moving toward." This is the credibility guardrail: the site must never contradict the résumé PDF a recruiter downloads.

> Existing `src/recruiter/content.ts` still holds Phase-6A placeholders (Senior SWE / EDI / RCM / "BFLOW RCM" / invented metrics). **Reconciling that file to the real CV with honest aspirational labels is the first task of Phase 6B.**

---

## Table of contents
1. [Product Vision](#1--product-vision)
2. [Information Architecture](#2--information-architecture)
3. [Case Study System](#3--case-study-system)
4. [Architecture Showcase](#4--architecture-showcase)
5. [Insights Platform](#5--insights-platform)
6. [Recruiter Journey Optimization](#6--recruiter-journey-optimization)
7. [Mobile Experience](#7--mobile-experience)
8. [Tablet Experience](#8--tablet-experience)
9. [Desktop Experience](#9--desktop-experience)
10. [Analytics](#10--analytics)
11. [Performance Architecture](#11--performance-architecture)
12. [Accessibility](#12--accessibility)
13. [SEO Architecture](#13--seo-architecture)
14. [Personal Brand Strategy](#14--personal-brand-strategy)
15. [Roadmap](#15--roadmap)
16. [Edge Cases](#16--edge-cases)

---

## 1 — Product Vision

### Current state (shipped)
JeffOS is a macOS-inspired "OS in the browser" portfolio (React 19 / TS / Vite / Zustand / React Query / Supabase / PWA). Phases 1–6A delivered: architecture/perf/responsive-shell/UX audits, a security-hardened + migration-tracked Supabase backend, working realtime via a `visit_stats` counter, asset manifests, and **Phase 6A Recruiter Mode** — now the default first paint (`RootRouter`), with JeffOS as a lazy-loaded opt-in. The conversion-first front door exists; its **content is still placeholder** and not yet reconciled to the real CV.

### Target state — 12 months
A **credible, fast, recruiter-converting portfolio** that doubles as a personal OS:
- Recruiter Mode is content-complete and **truthful to the CV** (backend/HealthTech/Supabase, part-time framing, aspirational HealthTech-data tracks honestly labeled).
- A **reusable case-study system** (§3) backs every project; Slippiggy + Dev Tooling Suite are full case studies; the schema scales to 100+.
- An **architecture showcase** (§4) and an **Insights** platform (§5) that boots gracefully from 0 posts.
- SEO that surfaces Jeffrey for **"Supabase engineer," "HealthTech backend engineer," "Node.js backend contractor"** (§13).
- Lighthouse 95+, WCAG AA+, observable, offline-resilient.

### Target state — 3 years
A **personal brand platform**: JeffOS is the signature artifact, Insights is a genuine technical blog with a readership, case studies are referenced in interviews, and the "web-OS" substrate (windowing/realtime/security) is extractable as its own product. The portfolio becomes an inbound channel (contracts find Jeffrey), not just an outbound link on applications.

### Why each exists / how they work together
- **Why JeffOS exists:** it is the *proof of engineering range* — the medium is the message. It earns respect from peer engineers and curious visitors and is the brand's signature.
- **Why Recruiter Mode exists:** the time-boxed recruiter on a phone needs signal (resume, projects, contact) in <10s. JeffOS as a first wall buried that signal; Recruiter Mode guarantees it.
- **Together:** `RootRouter` makes Recruiter Mode the default and JeffOS the deliberate opt-in (remembered per session). Signal first, delight on demand. One identity, two doors: the professional front door and the immersive easter-egg behind it.

---

## 2 — Information Architecture

Two top-level modes under `RootRouter` (already built). 6B/6C deepen each; the boundary is unchanged.

```
RootRouter  (default = Recruiter Mode; JeffOS = opt-in, remembered, lazy chunk)
│
├── RECRUITER MODE  (professional, conversion-first)
│   ├── Home            hero · Open To · primary CTAs
│   ├── Current Impact  outcome-first bullets (CV-true metrics)
│   ├── Architecture Highlights   decisions/tradeoffs (links into §4 gallery)
│   ├── Projects        case-study cards  → Case Study detail (§3)
│   ├── Experience      timeline (real roles/dates from CV)
│   ├── Résumé          inline PDF + download/share/print
│   ├── Insights        blog index (§5; empty-state ready)
│   └── Contact         "Schedule a Conversation" + email/socials
│        └── [Launch JeffOS] ───────────────────────────────┐
│                                                            ▼
└── JEFFOS MODE  (immersive desktop OS — preserved verbatim)
    ├── Desktop         windows · dock · menu bar · holiday themes
    ├── Finder · Terminal · Projects(recruiter app) · Games · iTunes · Synth
    ├── Themes/Wallpapers · Calendar · Control Panel · Guestbook · About
    └── [← Exit to Résumé] ─────────────────────────────────┘ (back to Recruiter)
```

**Relationships:**
- **Recruiter Projects ↔ JeffOS Projects:** the same `projects` data (live Supabase table) feeds both the Recruiter case-study cards and the in-OS recruiter app. One source, two presentations.
- **Architecture Highlights → Architecture Gallery (§4):** the Recruiter Home block is a teaser that deep-links into the full gallery.
- **Case Study (§3) ↔ Architecture Showcase (§4):** a case study *references* one or more architecture entries (e.g. Slippiggy → "OCR+LLM serverless pipeline" diagram); the gallery is the cross-cutting view.
- **Insights (§5) ↔ everything:** posts can link to case studies and architecture entries (and vice-versa) — an internal-linking graph that compounds SEO.
- **Mode persistence:** choosing JeffOS is remembered; Exit-to-Résumé clears it. Deep links (§13) always resolve into Recruiter Mode first.

---

## 3 — Case Study System

A reusable framework so every project — current, past, future — renders from one schema and one component. Designed for **100+** entries.

### 3.1 Canonical case-study schema
Each case study (8 required blocks):
| Block | Purpose |
|-------|---------|
| **Problem** | what was broken / the business need |
| **Constraints** | time, compliance, team, budget, legacy |
| **Architecture** | the system design (links to §4 gallery entry + diagram) |
| **Tech Stack** | concrete technologies |
| **Implementation** | what was actually built / how |
| **Challenges** | the hard parts + how they were navigated |
| **Results** | measurable outcomes (CV-true metrics) |
| **Lessons Learned** | reflection — the seniority signal |

Plus metadata: `slug`, `title`, `summary`, `status` (current/past/future), `featured`, `sort_order`, `tags[]`, `cover`, `links` (live/source), `architectureRefs[]`, `publishedAt`.

### 3.2 Data architecture
- **Source of truth:** extend the live `projects` table (currently name/slug/description/thumbnail_url/live_url/active) with case-study columns: `problem`, `constraints`, `architecture`, `tech_stack[]`, `implementation`, `challenges`, `results`, `lessons`, `status`, `featured`, `sort_order`, `tags[]`. RLS: public read of published rows (mirrors the Phase 4.5 `active` policy pattern).
- **Long-form bodies** (Implementation/Challenges narratives, images): store as Markdown/MDX in a `case-studies` Storage bucket (or a `body_md` column), referenced by slug — keeps the table light and the prose versionable.
- **Why not all-in-Postgres:** narrative + images belong in object storage/MDX; the table holds structured fields + pointers. Same decoupling principle as the games/themes manifests (Phase 5).

### 3.3 Rendering
- One `<CaseStudyCard>` (list/teaser, already prototyped in `ProjectFeed`) + one `<CaseStudyDetail>` (full 8-block view). Shell-agnostic: desktop section, tablet split, mobile full-screen.
- **Scale to 100+:** the index is paginated + virtualized + tag-filtered + searchable (Fuse.js, already a dep). Detail pages are individually lazy-loaded and SEO-addressable (§13).
- **Status lanes:** Current (live work), Past (shipped history), Future (what Jeffrey wants to build next — doubles as aspirational signal, honestly labeled).

### 3.4 Seed content (CV-true)
- **Slippiggy** — OCR + LLM document-processing pipeline (Supabase Edge Functions, OCR, OpenAI, Postgres, Vercel). Strong case study: Problem (manual document extraction) → Architecture (serverless OCR+LLM) → Results.
- **Dev Tooling Suite** — markdown link validator, code-example synchronizer, formatter. Signals documentation discipline.
- **JeffOS** — this very experience; engineering-range showcase.
- *Future lane (aspirational, labeled):* clinical-document digitisation, EHR/EMR connectivity, health-data pipelines — framed as "where I'm taking this," not done.

---

## 4 — Architecture Showcase

An **Architecture Gallery** — the cross-cutting, diagram-first view that proves systems thinking. Distinct from case studies (which are project-scoped); gallery entries are *patterns* a case study can reference.

### 4.1 Entry shape
Each gallery entry: `title`, `summary`, **diagram** (SVG/PNG in Storage), **key decisions**, **tradeoffs** (what was given up and why), **metrics** (real where available), and back-links to the case studies that use it.

### 4.2 Entries (truth-graded)
| Entry | Status | Basis |
|-------|--------|-------|
| **Supabase Architecture** (RLS, Auth, Edge, signed URLs, migrations) | ✅ real | CV + this repo's Phase 4.5/5 work — strongest, most defensible |
| **Realtime Systems** (counter pattern, curated publications) | ✅ real | Phase 5 `visit_stats` design |
| **JeffOS Architecture** (windowing, lazy shells, PWA) | ✅ real | this repo + [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) |
| **OCR + LLM Pipeline** (Slippiggy) | ✅ real | CV |
| **Multi-Tenant Systems** | 🟡 partial | CV shows RLS/RBAC isolation — frame as "RLS-based isolation," not full multi-tenant SaaS unless substantiated |
| **Healthcare data / HealthTech infra** | 🟡 aspirational-leaning | CV is HealthTech-oriented; label clinical specifics as direction |
| **EDI Pipelines** | 🔴 aspirational | **NOT in CV** — include only as a clearly-labeled "target architecture I'm studying," or omit. Do **not** present as built. |

> Guardrail: the gallery is where overclaiming is most tempting. Real entries lead; aspirational ones are visually + textually marked as "exploration / target," never mixed in as delivered work.

### 4.3 Presentation
Diagram-first cards → detail with zoomable diagram, decisions/tradeoffs columns, metrics row. Reuses §3's detail-page chrome. Diagrams are static assets (Storage, immutable-cached) — no heavy diagramming runtime on the client.

---

## 5 — Insights Platform

A technical blog that is **dignified at 0 posts** and **scales to 100+**, SEO-first.

### 5.1 Categories
Engineering · HealthTech · EDI · Supabase · Architecture · Career. (EDI category exists but, until there's real EDI work, its posts are "learning in public" — honest.)

### 5.2 Data + content model
- `insights` table: `slug`, `title`, `excerpt`, `category`, `tags[]`, `published_at`, `featured`, `reading_time`, `body_ref`. RLS public-read of published rows.
- Bodies as **MDX/Markdown** in a Storage bucket (or repo `/content`), so posts can embed code, diagrams, and links to case studies/gallery entries.
- **0-post state:** the section shows the category chips + "writing soon, follow on LinkedIn" — never an empty grid (already designed in Phase 6A `Insights`).

### 5.3 Scale + SEO
- Index: paginated, tag/category filtered, searchable (Fuse.js).
- Each post is an SEO-addressable route with metadata, OG image, structured data (§13).
- Internal-linking graph (posts ↔ case studies ↔ gallery) compounds authority.
- RSS/Atom feed for syndication; sitemap auto-includes posts.

---

## 6 — Recruiter Journey Optimization

All journeys resolve into Recruiter Mode first (signal before novelty). Tuned per referrer.

| Visitor | Questions | Friction (to kill) | Desired action | Conversion path |
|---------|-----------|--------------------|----------------|-----------------|
| **LinkedIn** | Seniority? Backend/HealthTech fit? Available (part-time)? | landing in OS; vague title | Schedule / download résumé | Home (title + **Open To: part-time**) → Current Impact → Schedule (<10s) |
| **GitHub** | Is the code real? Architecture quality? | wants depth, not marketing | Read source → Schedule | Projects (Source links) → Architecture Gallery → JeffOS → Schedule |
| **Google** | Who is this? Credible? | ambiguous identity | Orient → contact | SEO landing (case study / insight) → Home → Contact |
| **Referral** | Did X vouch accurately? | trust transfer | Confirm fit fast | Home → relevant case study → Schedule |
| **Potential client** | Can he solve *my* problem? Reliable? Reachable? | no service framing; full-time assumption | Book a call | Case studies (Problem→Results) → **Open To: contract/consulting** → Schedule |

**Cross-cutting:** every journey needs the **part-time/contract availability** surfaced early (it's a key qualifier in the CV) and a friction-free **booking** action (replace mailto with a scheduler — §10/§15). GitHub visitors get JeffOS surfaced a touch more; recruiters get résumé/schedule surfaced more.

---

## 7 — Mobile Experience

Premium, mobile-first, **no desktop metaphors** (no windows/dock/Finder). Built on the Phase 6A bottom-tab `RecruiterMobile`.

- **Bottom navigation:** Home · Projects · Experience · Résumé · Contact (Tier-0 always one thumb away). Active tab in `--color-hire`.
- **Resume-first / Project-first:** Home shows hero + Open To + impact above the fold; Résumé and Projects are dedicated tabs; sticky primary CTA.
- **Fast loading:** Recruiter Mode is its own light chunk; JeffOS never loads here unless opted in; images lazy + blur-up; manifests over runtime discovery.

**Device coverage (detection → adaptation):**
| Case | Handling |
|------|----------|
| **Phones** | default bottom-tab layout; safe-area insets |
| **Small phones** (≤360px) | fluid `clamp()` type ramp; single-column; condensed hero |
| **Foldables** | `useFormFactor` re-evaluates on resize/orientation; treat unfolded as tablet, folded as phone |
| **Landscape** | coarse+short → stays mobile (already in `useFormFactor`); scrollable content, TabBar persists; avoid full-height PDF lock |
| **Low-end devices** | no heavy animations on first paint; reduced-motion friendly; defer non-critical work; never auto-load EmulatorJS/Synth |

---

## 8 — Tablet Experience

Hybrid: **professional shell by default, OS mode optional** (Phase 6A currently renders the desktop sections on tablet; 6B builds the dedicated layout).

- **Professional shell:** left **sidebar rail** (Home/Projects/Experience/Résumé/Insights/Contact) + a single focused content pane. "Launch JeffOS" in the rail footer.
- **Split-view patterns:** snap-to-half for browse+preview — Projects list (left) / case-study detail (right); Insights index / post.
- **Sidebar patterns:** persistent rail on landscape; collapsible to icons on portrait; rail footer holds Open-To status + Schedule CTA.
- **Touch interactions:** ≥44px targets; swipe between rail sections; bottom sheets (`vaul`) for Contact; momentum scroll; no hover-only affordances.

---

## 9 — Desktop Experience

- **Professional landing:** Recruiter Mode default paint (faux menu-bar nod, hero, sections) — already shipped.
- **JeffOS launch:** deliberate "Launch JeffOS" → lazy desktop OS (shipped). Frame as "see the OS I built."
- **Return-to-recruiter:** "← Exit to Résumé" (shipped; fixed the click-interception bug in 6A) clears the launched flag.

**Desktop-specific enhancements (6B/6C):**
| Enhancement | Design |
|-------------|--------|
| **Spotlight / Command palette** | ⌘K opens a universal launcher (Fuse.js): jump to any section, case study, insight, or JeffOS app; recruiter actions ("Download résumé", "Schedule") as commands |
| **Quick actions** | persistent header actions (Schedule / Résumé) + a `?` keyboard-help overlay (a `KeyboardHelp` component already exists in the OS) |
| **Keyboard shortcuts** | Recruiter Mode: `g h/p/e/r/c` to nav sections, `/` focus search, `Esc` close overlays; JeffOS keeps its existing shortcuts |
| **Command palette in both modes** | one palette implementation, mode-aware command set |

---

## 10 — Analytics

Privacy-respecting recruiter analytics (the funnel is the product metric).

- **Events:** résumé views, résumé downloads, project views (which), contact clicks, email clicks, schedule clicks, JeffOS launches, time-to-first-interaction, referrer, funnel completion (Home→Résumé/Projects→Schedule).
- **Privacy:** anonymous only (reuse the existing `anonId`); no PII; no third-party ad trackers; cookieless; respect Do-Not-Track. A privacy-friendly approach (self-hosted counter via Supabase, or Plausible/Umami) over Google Analytics.
- **Implementation:** a thin event beacon → a Supabase `events` table (RLS insert-only via an Edge Function, mirroring the write-through-Edge pattern) or a privacy analytics service. Ties into the observability beacon from [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) §12.
- **Dashboard:** a simple private view (counts by event/referrer/day) to learn which case studies and channels convert.

---

## 11 — Performance Architecture

Targets: **Lighthouse 95+ · <2s first paint · <3s interactive** (mid-range Android / 4G).

- **Caching:** existing PWA/Workbox (CacheFirst assets, NetworkFirst docs); React Query staleTime per domain; manifests stale-while-revalidate; immutable cache headers on Storage assets (case-study/gallery diagrams, résumé).
- **Code splitting:** Recruiter Mode is the light default chunk; **JeffOS is a separate lazy chunk** (achieved in 6A — main bundle ~160KB→~118KB). Case-study detail, Insights, Architecture Gallery, and the command palette each lazy-load.
- **Lazy loading:** route/section-level; images lazy + blur-up; diagrams on-demand; heavy OS apps never on first paint.
- **Image optimization:** webp/avif (Storage MIME allow-list from Phase 5 plan), responsive sizes, OG images pre-generated.
- **Manifest loading:** continue replacing runtime discovery with manifests (themes manifest shipped in Phase 5; case studies/insights are indexed reads, not fan-out).
- **Realtime efficiency:** the Phase 5 counter pattern stays the rule — publish only small curated tables; analytics writes are fire-and-forget, never blocking paint.
- **Budgets in CI:** Lighthouse CI on the Recruiter Mode mobile path; bundle-size budget on the entry chunk (`rollup-plugin-visualizer`).

---

## 12 — Accessibility (WCAG AA+)

- **Keyboard:** full operability across Recruiter Mode + command palette; section shortcuts; visible focus ring (`--color-ring`); skip-to-content; JeffOS keyboard model preserved.
- **Screen readers:** semantic landmarks (`header/nav/main`), labeled tabs/CTAs/sheets, live regions for toasts + visitor count, accessible names on the résumé viewer + diagrams (alt/longdesc), case-study headings as a proper outline.
- **Zoom:** pinch-zoom preserved (already correct in `App.tsx`); reflow to 400% without loss.
- **Reduced motion:** `prefers-reduced-motion` honored on hero/transitions/genie/Framer; command-palette + tab transitions degrade to fades.
- **Focus management:** trap in sheets/palette/active mobile surface; return focus on close; `Esc` everywhere.
- **Contrast:** text + CTAs ≥4.5:1 across **every** holiday theme; the theme-independent `--color-hire`/`--color-live` tokens (shipped 6A) guarantee the CTA stays AA regardless of seasonal accent.
- **Gate:** axe-clean + manual keyboard + VoiceOver/TalkBack pass on the Tier-0 path before each merge.

---

## 13 — SEO Architecture

The portfolio must be **findable** — today it's an SPA with one title; 6B/6C make it indexable and rich.

- **Rendering for crawlers:** the biggest lever. Move SEO-critical routes (Home, each case study, each insight, gallery entries) to **pre-rendered/SSG HTML** (Vite SSG or prerender plugin) so content is in the initial HTML, not JS-only. Keep JeffOS client-only (no SEO value, intentionally).
- **Metadata:** per-route `<title>`, meta description, canonical URL; a head-management approach for the SPA routes.
- **Structured data (JSON-LD):** `Person` (Jeffrey), `WebSite` + `SearchAction`, `Article` per insight, `CreativeWork`/`SoftwareSourceCode` per case study, `BreadcrumbList`.
- **Open Graph / Twitter cards:** per-route OG image (pre-generated), title, description — so shared links render richly on LinkedIn/Twitter/Slack.
- **Sitemaps + robots:** auto-generated `sitemap.xml` (Home, case studies, insights, gallery), `robots.txt`, RSS for insights.
- **Canonical URLs:** stable slugs (`/work/slippiggy`, `/insights/<slug>`, `/architecture/<slug>`); deep links resolve into Recruiter Mode.
- **Target queries (truth-graded):** lead with defensible terms — **"Supabase engineer," "HealthTech backend engineer," "Node.js backend contractor," "PostgreSQL/RLS engineer," "OCR/LLM pipeline developer."** EDI/RCM terms only on honestly-labeled "targeting" content, so search intent isn't met with a contradicted claim.

---

## 14 — Personal Brand Strategy

**Positioning (CV-true core + aspirational track, clearly separated):**

> **Core (verifiable, foreground):** Backend Engineer · **Supabase Architect** · **HealthTech Backend** · Systems Thinker. 4 years building secure, scalable APIs, automation pipelines, RLS/RBAC data layers, OCR+LLM pipelines. Available for **part-time backend contracts**.
>
> **Aspirational track (labeled "targeting / moving toward," never "experienced"):** clinical API integrations, EHR/EMR connectivity, health-data pipelines, and **EDI / RCM** systems — the direction Jeffrey is steering his HealthTech backend work.

**Why this framing:** a recruiter who downloads the résumé must find it *consistent* with the site. Claiming EDI/RCM experience the CV doesn't show is the fastest way to lose trust. Honest aspirational framing still targets those roles (and the SEO/insights can build genuine EDI/Supabase-in-healthcare credibility over time) without overclaiming.

**Content/portfolio strategy supporting it:**
- **Case studies** prove the core (Slippiggy = HealthTech-transferable OCR/LLM; JeffOS = range; Dev Tooling = discipline).
- **Architecture Gallery** anchors "Supabase Architect / Systems Thinker" with real diagrams + tradeoffs.
- **Insights** is the brand engine: "learning in public" posts on Supabase-in-HealthTech, secure data pipelines, and (honestly) studying EDI/RCM — converts aspiration into demonstrated trajectory.
- **Consistency contract:** site copy, résumé PDF, and LinkedIn carry the *same* core + the *same* aspirational labels. (Reconcile `content.ts` first — §15 Phase 6B task 1.)

---

## 15 — Roadmap

Prioritized by **impact · complexity · recruiter conversion · brand**.

### Phase 6B — Content truth + case-study depth (highest impact, low/med complexity)
1. **Reconcile `content.ts` to the real CV** (positioning, real roles/dates, real metrics, part-time framing; EDI/RCM → labeled aspirational). *Conversion-critical; blocks credibility.* **Do first.**
2. **Replace the résumé PDF** in the `portfolio` bucket with the current CV; single-source the filename.
3. **Case-study system (§3):** extend `projects` schema (migration, tracked), build `CaseStudyDetail`, seed Slippiggy + Dev Tooling + JeffOS.
4. **Scheduler integration** (Cal.com/Calendly) replacing the mailto fallback.
5. **Analytics v1 (§10)** — event beacon + funnel.
6. **Tablet shell (§8)** — rail + split view.

### Phase 6C — Authority + discoverability (high brand, med complexity)
1. **SEO architecture (§13)** — SSG/prerender for Home + case studies + insights, metadata, JSON-LD, OG, sitemap.
2. **Insights platform (§5)** — table + MDX bodies + index; publish first "learning in public" posts.
3. **Architecture Gallery (§4)** — real entries (Supabase/Realtime/JeffOS/Slippiggy) with diagrams.
4. **Command palette / Spotlight (§9)** + keyboard shortcuts.
5. **Conversion A/B** on CTA copy/placement; referrer-aware messaging.

### Phase 7 — Platform & polish
- Observability (web-vitals + cron/edge/realtime alerts — closes the [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) §12 gap), disaster-recovery runbooks/PITR, Postgres upgrade, finish deferred Phase 5 items (games_index population, bucket-listing lockdown).
- Authenticated **admin surface** to manage projects/insights/case studies (separate role/RLS).

### Phase 8 — Brand platform & extraction
- Insights as a real blog with readership + RSS growth; newsletter.
- Extract the **web-OS substrate** (windowing/realtime/security) as a reusable product.
- WCAG AA+ certification; internationalization if warranted.

---

## 16 — Edge Cases

| Case | Detection | Mitigation | Recovery |
|------|-----------|------------|----------|
| **Offline mode** | SW + `navigator.onLine` | PWA caches Recruiter shell + last reads + résumé; offline banner; queue contact/guestbook writes | replay on reconnect; refetch source of truth |
| **Broken Supabase** | failed reads / 5xx | Recruiter Mode renders from cached/static content (hero, résumé link, contact are not DB-dependent); skeletons not spinners | retry with backoff; static fallback copy ensures the hire path never fully breaks |
| **Failed Edge Functions** (schedule/contact/analytics) | non-2xx | analytics is fire-and-forget (never blocks UI); contact falls back to mailto; schedule falls back to email | surface a toast; user still has email/LinkedIn |
| **Missing projects** (empty `projects`) | query returns `[]` | "Projects coming soon" empty state (not a broken grid); Home still converts via résumé/contact | re-fetch; admin adds rows |
| **Empty case studies** | no published rows / missing body | card hides incomplete blocks; detail shows only present sections; no "undefined" | author fills blocks; status=draft hidden from public |
| **Slow networks** | slow `connection`/long LCP | defer heavy assets; blur-up images; résumé loads progressively; JeffOS never auto-loads | timeouts + retry; cached shell paints instantly |
| **Expired links** (résumé/diagram URL stale) | 404 on asset | versioned immutable paths; manifest as inventory; SW serves cached copy | re-upload; manifest repoint |
| **Large traffic spikes** | egress/RPS surge | static/SSG pages served from CDN (no DB); counter pattern avoids COUNT storms (Phase 5); analytics batched | Supabase autoscale; rate-limit Edge writes; shed analytics before content |
| **Theme/holiday breakage** (cron no-op) | `defaults.active_holiday_theme` stale | client falls back to default wallpaper; Recruiter Mode is theme-independent for the hire CTA | Phase 5 cron fix + monitor next run |
| **JeffOS crash** | error boundary trips | per-shell `ErrorBoundary` (shipped 6A) isolates it; "Exit to Résumé" always available | reset subtree; recruiter path unaffected |

---

*Design only. No code was written and no database/infrastructure changes were made. This document sequences Phases 6B → 8 on top of the shipped 6A architecture, with the positioning guardrail (CV-true core, honestly-labeled aspirational EDI/RCM) governing all brand, case-study, and SEO work.*
