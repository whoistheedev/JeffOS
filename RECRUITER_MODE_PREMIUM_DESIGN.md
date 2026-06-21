# JeffOS — Recruiter Mode: Premium Engineering Profile

> Award-winning product design · recruiter · CTO · personal-brand lens.
> **Design only — no code.** Builds on the shipped Recruiter Mode (`RootRouter`, `src/recruiter/*`).
> Authored 2026-06-21. Positioning confirmed real by Jeffrey: EDI/RCM/HealthTech/multi-tenant migration are **current delivered work** (the CV undersells them). See [[jeffos-positioning]] memory.
> Aesthetic target: **Stripe · Linear · Vercel · Retool · OpenAI** — minimal, sophisticated, executive, technical.

---

## 0. Positioning (the spine of every decision)

**Jeffrey James Idodo — a systems engineer who happens to build software.**

> **I design and build the systems that move critical business operations.**
> Current focus: Healthcare · Revenue Cycle Management · EDI Infrastructure · Multi-Tenant SaaS · Supabase Architecture.

Titles carried: **Senior Software Engineer · EDI Pipeline Specialist · HealthTech Systems Engineer · RCM Specialist · Supabase Architect · Multi-Tenant SaaS Architect · Systems Thinker.**

**Anti-positioning (what the design must NOT say):** not a "frontend developer," not a "JavaScript developer," not a template portfolio. Every layout choice should read *business-critical systems*, not *another dev portfolio*.

> **One honesty guardrail kept:** exact figures not yet verified (e.g. "50+ databases") are marked `CONFIRM` in content so a technical screen never catches an unbackable number. The work is real; only unverified *counts* get a confirm flag.

---

## 1. Information Architecture

Two modes under the existing `RootRouter` (Recruiter default; JeffOS opt-in). Recruiter Mode IA — résumé is intentionally **not** a section (it's a secondary download, per the prior change):

```
RECRUITER MODE  (executive, conversion-first)
│
├── Hero               narrative headline · 2 CTAs · trust indicators
├── Current Impact     what I'm doing TODAY (executive altitude)
├── Architecture Highlights   4 capability cards
├── Featured Work      case studies (Problem→Constraints→Architecture→Solution→Outcome)
├── Experience         systems/leadership timeline (not "years of React")
├── Available For      role/engagement signal
├── JeffOS             "want to see how I think? Launch JeffOS"
├── Contact            premium contact (not a form)
└── Footer             secondary Download Résumé + minimal links
        └── [Launch JeffOS] ──► JeffOS Mode (immersive OS, preserved)
                                   └── [← Exit to Résumé]
```

**Hierarchy logic (recruiter scan order):** Narrative (who) → Impact (proof, now) → Architecture (how I think) → Work (evidence) → Experience (track record) → Available For (fit) → Contact (act). JeffOS sits late — it's the *flex*, not the pitch. Résumé is a download, never a gate.

**Relationships:** Architecture Highlights cards deep-link into the matching Featured Work case study; case studies reference the same live `projects` data the JeffOS recruiter app uses (one source); Available For + Contact share the same primary CTA ("Schedule a Conversation").

---

## 2. UX Flow

```
Entry (any referrer)
  → Hero: "Building the systems behind healthcare operations."
     ├─ primary:  Schedule a Conversation ─────────────► scheduler / mailto
     └─ secondary: Launch JeffOS ──────────► JeffOS (remembered) ──► Exit returns here
  → scroll: Current Impact (executive proof)
  → Architecture Highlights (4 cards) ──tap──► matching Featured Work case study
  → Featured Work (case-study reader)
  → Experience (timeline) → Available For
  → Contact (Schedule / Email / LinkedIn / GitHub) + Footer (Download Résumé)

Conversion exits available at every scroll depth: a persistent "Schedule" affordance
(desktop: sticky top-right; mobile: Contact tab + sticky CTA).
```

**Principles:** signal before novelty; ≤1 interaction to the primary CTA from any state; JeffOS is opt-in and reversible; résumé reachable but never required to understand the story.

---

## 3. Visual Design Direction

The aesthetic is the message: **restraint signals seniority.**

| Element | Direction (Stripe/Linear/Vercel) |
|---------|----------------------------------|
| **Palette** | Near-monochrome: ink/near-black on white; one restrained accent for CTAs only. Dark mode = true dark (near-black, not navy). **No gradients, no neon, no gaming glow.** Reuse the OKLCH token system already in `index.css`; `--color-hire` is the single accent. |
| **Typography** | Large, confident headings (tight tracking, high weight); generous line-height body; a clear 4–5 step type scale. System/Inter-class sans; mono for technical accents (EDI codes, metrics). Big hero headline (clamp ~2.5–4rem). |
| **Whitespace** | Generous, deliberate. Wide section rhythm; max content width ~720–820px for reading, wider for case-study layouts. Whitespace = confidence. |
| **Surface** | Subtle bordered cards (1px hairline, not heavy shadows); thin dividers between sections; flat, not skeuomorphic. |
| **Motion** | Professional, minimal: short fades/translates on scroll-in (≤240ms), no parallax, no bounce. Honors `prefers-reduced-motion`. |
| **Data as decoration** | Metrics and EDI codes (837/835/277/999) rendered as small mono "chips" — the only "ornament," and it reads technical, not flashy. |
| **Imagery** | No project screenshots. Architecture diagrams (clean line SVGs) and outcome metrics carry the visual weight. |

**Brand nod:** a faux menu-bar strip ("Jeff · File · View") is the one playful JeffOS signature — subtle, executive, signals "I built the OS too."

---

## 4. Content Strategy

Every section speaks in **outcomes and systems**, not tasks and tools.

### Hero
- **Headline:** "Building the systems behind healthcare operations."
- **Subheadline:** "Senior Software Engineer specializing in EDI pipelines, healthcare automation, multi-tenant SaaS architecture, and scalable business systems."
- **Primary CTA:** Schedule a Conversation · **Secondary:** Launch JeffOS
- **Trust indicators (mono chips):** Healthcare Systems · EDI Infrastructure · Supabase Architecture · Multi-Tenant Platforms

### Current Impact (executive — "today")
- Leading migration of **50+** `CONFIRM` healthcare databases into a unified multi-tenant platform.
- Building HIPAA-aware healthcare workflows.
- Designing EDI pipelines supporting **837 · 835 · 277 · 999**.
- Architecting healthcare revenue-cycle systems (claims → eligibility → payments → denials → reporting).
- Improving operational scalability and data integrity across tenants.
> Voice: present tense, first-person-implied, outcome-led. No "I used React." This reads like a staff-engineer's brag doc.

### Architecture Highlights (4 cards)
1. **Multi-Tenant Architecture** — Consolidating dozens of isolated healthcare systems into a unified architecture using Supabase, RLS, and modern application patterns.
2. **EDI Processing Infrastructure** — Automated claims-processing pipelines that transform healthcare transactions (837/835/277/999) into operational workflows.
3. **Healthcare Revenue Cycle Systems** — Systems connecting claims, eligibility, payments, denials, and reporting.
4. **Supabase Architecture** — Realtime systems, storage, Edge Functions, RLS, observability, and scalability planning.

### Featured Work — case-study format (no screenshots; outcomes)
Each: **Problem · Constraints · Architecture · Solution · Outcome.**
- **BFLOW RCM Platform** — revenue-cycle automation; the flagship (healthcare + EDI + multi-tenant Supabase).
- **Multi-Tenant Database Migration** — consolidating isolated healthcare DBs; RLS isolation, data integrity, zero-trust tenancy.
- **EDI Automation Platform** — 837/835/277/999 ingestion → normalized operational workflows.
- **JeffOS** — engineering-capability proof (systems thinking, realtime, security, perf).

### Experience (systems/leadership, not React-years)
Emphasize: HealthTech · EDI · architecture · leadership · ownership · decision-making · system design. Each role = decisions made and systems owned, not frameworks touched.

### Available For
Senior Software Engineer · Staff Engineer · HealthTech Engineering · Supabase Architecture · EDI Platforms · Technical Consulting · Remote.

### JeffOS section
- **Title:** "Built this operating-system-style portfolio from scratch."
- **Body:** "Want to see how I think as an engineer? Launch JeffOS." Positioned as *proof*, not the main act.

### Contact (premium, not a form)
Email · GitHub · LinkedIn · **Schedule a Conversation** (primary). Goal: high-value opportunities — copy speaks to that ("Let's talk about systems worth building").

---

## 5. Component Hierarchy

Builds on existing `src/recruiter/*`; ★ = new/reworked for the premium pass.

```
<RootRouter>                                  (exists)
└─ <RecruiterMode>                            (exists; restyled)
   ├─ <ExecutiveHeader>            ★ faux menu-bar + sticky "Schedule" affordance
   ├─ <Hero>                       ★ narrative headline, 2 CTAs, trust-indicator chips
   ├─ <CurrentImpact>             ★ executive bullet/stat layout (mono metric chips)
   ├─ <ArchitectureHighlights>    ★ 4 capability cards → deep-link to case study
   ├─ <FeaturedWork>              ★ case-study list
   │   └─ <CaseStudy>             ★ Problem/Constraints/Architecture/Solution/Outcome
   ├─ <ExperienceTimeline>        (exists; recop"systems/leadership" voice)
   ├─ <AvailableFor>              ★ role/engagement chips
   ├─ <JeffOSCallout>             ★ "see how I think" → Launch JeffOS
   ├─ <ContactPremium>            ★ Schedule/Email/LinkedIn/GitHub (no form)
   └─ <RecruiterFooter>           (exists; holds secondary Download Résumé)

Shared / primitives
├─ <SectionShell>                 ★ consistent heading + rhythm + divider
├─ <MetricChip> / <CodeChip>      ★ mono outcome + EDI-code chips
├─ <Card>                          (hairline-bordered surface)
├─ <CTAButton>                     (primary = --color-hire; secondary = outline)
├─ <ContactActions>               (exists; Schedule primary + Download Résumé secondary)
├─ <HireMeSheet>                  (exists; mobile bottom sheet)
└─ <ErrorBoundary>                (exists; per-section + per-shell)

content.ts (single source of truth)            ★ rewritten to the executive narrative
```

---

## 6. Mobile Layout

Mobile-first, recruiter-focused, fast. Bottom nav: **Home · Projects · Experience · Contact** (no Résumé tab — it's a download in Contact + footer + Hire Me).

```
┌───────────────────────┐
│ Jeff · File · View    │  faux menu-bar (thin)
│                       │
│ Building the systems  │  ← hero headline (large, confident)
│ behind healthcare     │
│ operations.           │
│ [Schedule a Convo]    │  primary CTA (full-width)
│ [Launch JeffOS]       │  secondary (outline)
│ Healthcare · EDI ·    │  trust chips (mono, wrap)
│ Supabase · Multitenant│
│ ── Current Impact ──  │  executive bullets + metric chips
│ ── Architecture ──    │  4 cards stacked
├───────────────────────┤
│ 🏠   ▣    ⏱    ✉      │  bottom tab bar (4-up)
│ Home Proj  Exp  Contact│
└───────────────────────┘
```
- **Tabs:** Home (hero + impact + architecture + available-for + JeffOS callout), Projects (Featured Work case studies), Experience (timeline), Contact (premium + footer download).
- Sticky primary CTA; 44px targets; safe-area insets; skeletons over spinners.
- **Edge devices:** small phones → fluid `clamp()` type; foldables → re-evaluate on resize (`useFormFactor`); landscape phone → stays mobile, content scrolls, TabBar persists; low-end → no scroll-motion on first paint, JeffOS never auto-loads.

---

## 7. Desktop Layout

Single-column reading spine (max ~800px) centered in generous whitespace; case studies may break wider.

```
┌──────────────────────────────────────────────────────────────┐
│ Jeff · File · View · Help                    [Schedule] (sticky)│  executive header
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   Building the systems behind healthcare operations.           │  hero (large)
│   Senior Software Engineer — EDI · healthcare automation ·     │
│   multi-tenant SaaS · scalable business systems.               │
│   [ Schedule a Conversation ]   [ Launch JeffOS ]              │
│   Healthcare · EDI · Supabase · Multi-Tenant   (mono chips)    │
│                                                                │
│   ── Current Impact ───────────────────────────────────────   │  executive bullets
│   • Leading migration of 50+ healthcare DBs → multi-tenant     │  + metric chips
│   • EDI pipelines: 837 · 835 · 277 · 999                       │
│                                                                │
│   ── Architecture Highlights ──   [ 4 cards, 2×2 ]            │  → deep-link to case study
│   ── Featured Work ──   [ case studies: Problem→Outcome ]      │
│   ── Experience ──      [ systems/leadership timeline ]        │
│   ── Available For ──   [ role chips ]                         │
│   ── JeffOS ──  "see how I think" [ Launch JeffOS ]           │
│   ── Contact ── Schedule · Email · LinkedIn · GitHub          │
│   ── footer ── Download Résumé · © Jeffrey James Idodo        │
└──────────────────────────────────────────────────────────────┘
```
**Desktop enhancers (progressive):** sticky "Schedule" in the header; optional ⌘K command palette (jump to section / case study / download résumé / launch JeffOS); keyboard section nav. Hover states subtle (border/elevation shift, no glow).

---

## 8. Conversion Funnel

The funnel is the product. Primary goal = **booked conversations** (high-value opportunities).

```
Impression (any referrer)
  └─► Hero comprehension (<10s)   ── metric: scroll-past-hero / time-to-first-interaction
        └─► Proof (Current Impact + Architecture)   ── metric: section reach depth
              └─► Evidence (Featured Work)   ── metric: case-study views (which)
                    └─► Intent (Available For / Contact)   ── metric: CTA visibility
                          └─► ACTION
                               ├─ Schedule a Conversation   ◄── PRIMARY conversion
                               ├─ Email / LinkedIn / GitHub  ◄── secondary
                               └─ Download Résumé            ◄── tertiary (assist, not goal)
        side-quest: Launch JeffOS ── metric: launch rate (engineer-curiosity signal)
```
**Optimization:** persistent Schedule affordance at every depth; the résumé is an *assist*, never the conversion; referrer-aware emphasis (GitHub → JeffOS + case studies; LinkedIn/Google → Schedule + Impact). Replace `mailto` fallback with a real scheduler (Cal.com/Calendly) — the single biggest funnel upgrade.

---

## 9. Analytics Strategy

Privacy-respecting, anonymous (reuse the existing `anonId`); no ad trackers; cookieless; honors DNT.

**Track:** Schedule clicks (primary KPI), email/LinkedIn/GitHub clicks, résumé downloads, case-study views (per project), JeffOS launches, time-to-first-interaction, scroll/section-reach depth, referrer, funnel completion (Hero→Impact→Work→Schedule).

**How:** thin fire-and-forget beacon → a Supabase `events` table (insert via Edge Function, mirroring the write-through-Edge pattern) **or** a privacy analytics service (Plausible/Umami). Never blocks paint. Feeds a small private dashboard (counts by event/referrer/day) to learn which case studies and channels convert. Ties into the observability layer in [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) §12.

---

## 10. Implementation Plan

Builds on shipped Recruiter Mode; sequence by impact × low risk.

| Step | Work | Notes |
|------|------|-------|
| **1. Content** | Rewrite `content.ts` to the executive narrative (Hero, Current Impact, Architecture Highlights, Available For, Contact copy). Mark unverified figures `CONFIRM` (e.g. "50+"). | Highest impact; the work is real per [[jeffos-positioning]] — present it. |
| **2. Design system** | Apply the restraint pass: type scale, whitespace rhythm, hairline cards, `MetricChip`/`CodeChip`, monochrome + single accent, dark-mode true-dark. | Tokens already exist; this is styling + 2 primitives. |
| **3. Hero + ExecutiveHeader** | New narrative hero, trust chips, sticky Schedule. | Conversion-critical. |
| **4. Current Impact + Architecture cards** | Executive bullet/stat layout; 4 cards → deep-link to case studies. | Reuses existing section scaffolds. |
| **5. Featured Work / CaseStudy** | Case-study component (Problem→Outcome); seed BFLOW RCM, Multi-Tenant Migration, EDI Automation, JeffOS. Extend `projects` schema (tracked migration) for case-study fields. | The depth that sells seniority. |
| **6. Experience recopy + Available For + JeffOS callout + Contact** | Systems/leadership voice; role chips; premium contact. | Mostly copy + light layout. |
| **7. Scheduler** | Integrate Cal.com/Calendly; replace mailto. | Biggest funnel unlock. |
| **8. Analytics v1** | Event beacon + funnel. | Measure from day one. |
| **9. Verify** | `/run` across desktop/tablet/mobile + dark mode + reduced motion + axe; screenshot. | Existing `run-jeffos` skill. |

**Each step:** build → `npm run build` → `/run` verify → commit on the recruiter branch.

---

## 11. Edge Cases (detection → mitigation → recovery)

| Case | Detection | Mitigation | Recovery |
|------|-----------|------------|----------|
| **No projects** (empty `projects`) | query `[]` | Featured Work shows the static case-study narratives (content.ts) regardless; Hero/Impact/Contact are DB-independent | re-fetch; admin adds rows |
| **Empty data states** | missing fields | render only present blocks; never "undefined"; case studies hide absent sections | author fills |
| **Slow network** | long LCP / slow `connection` | hero is text+CTAs (no heavy asset); diagrams lazy + blur-up; JeffOS never auto-loads | cached shell paints instantly; retry w/ backoff |
| **Supabase unavailable** | failed reads / 5xx | the entire pitch (Hero, Impact, Architecture, Featured Work copy, Contact) is **static** and renders without the DB; only live `projects` enrichment degrades | retry; static narrative ensures the hire path never breaks |
| **Mobile devices** | `useFormFactor=mobile` | bottom-tab layout, sticky CTA, safe-area | n/a |
| **Tablet devices** | `useFormFactor=tablet` | reading spine + (future) rail/split | n/a |
| **Dark mode** | `prefers-color-scheme` / `.dark` | true-dark palette via existing tokens; `--color-hire` AA-checked on dark | n/a |
| **Accessibility** | axe / manual | semantic landmarks, labeled CTAs, focus ring, ≥4.5:1 contrast, keyboard-complete, alt/longdesc on diagrams | gate before merge |
| **Reduced motion** | `prefers-reduced-motion` | scroll-in animations → instant; no parallax | n/a |
| **JeffOS crash** | ErrorBoundary | isolated; Exit-to-Résumé always available | reset subtree; recruiter path unaffected |

---

## 12. Why this reads as "builds business-critical systems"

- **Narrative altitude:** "systems behind healthcare operations," not "I build web apps."
- **Domain specificity:** 837/835/277/999, RCM, multi-tenant, HIPAA-aware — the vocabulary of someone *inside* healthcare infrastructure.
- **Outcomes over artifacts:** case studies are Problem→Outcome, not screenshots.
- **Restraint as signal:** Stripe/Linear-grade minimalism telegraphs seniority more than any gradient.
- **JeffOS as the flex, not the pitch:** proof of capability, deliberately secondary.
- **Defensibility:** every claim maps to real work; only unverified counts are flagged — so the site, the résumé, and the interview all tell the same story.

---

*Design only. No code written, no DB/infra changes. This document drives the premium pass on the shipped Recruiter Mode; content presents Jeffrey's real EDI/RCM/HealthTech/multi-tenant work at executive altitude, with unverified figures flagged for confirmation.*
