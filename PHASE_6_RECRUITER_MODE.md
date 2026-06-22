# JeffOS — Phase 6: Recruiter Mode

> Staff Product Designer · Principal Frontend Architect · Senior UX Researcher.
> **Design only — no code, no implementation, no database changes.**
> Authored 2026-06-21. Source of truth: this repository (`src/`, shells, `index.css` tokens) + the live Supabase project `akqqmrqeloasisiybdjx`.
> Builds on: [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) · [PHASE_6_UI_UX_REDESIGN.md](PHASE_6_UI_UX_REDESIGN.md) · [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) · [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md)
> **Audience:** CTO · Design Lead · Product Manager · Recruiter.

---

## 0. The one decision this document makes

**Invert the funnel.** Recruiter Mode becomes the **default first paint** for every new visitor; JeffOS (the desktop OS) becomes a **deliberate opt-in** behind a "Launch JeffOS" action.

```
CURRENT                          TARGET
Visitor                          Visitor
  ↓                                ↓
Desktop OS (novelty wall)        Recruiter Home  ← Who / What / Built / Why / Contact
  ↓                                ↓  (answers in <10s)
hunt for Résumé                  [Launch JeffOS] ← optional immersive experience
```

> **Decision (confirmed):** Recruiter Mode is the default; JeffOS is opt-in. We do **not** redesign JeffOS — it is preserved 100% and reached one click away. We add a professional front door in front of it.

This is the highest-leverage change in the whole project: the most important user (a time-boxed recruiter on a phone) currently hits a desktop OS with no obvious résumé path. Recruiter Mode removes that wall while keeping the OS as the *proof of engineering range* for those who want it.

---

## 1. Scope & guardrails

**In scope:** a new top-level **Recruiter Mode** experience (Home, Current Role, Projects-as-case-studies, Experience timeline, Résumé, Contact funnel, Insights) across mobile / tablet / desktop, plus the routing that makes it default and JeffOS opt-in.

**Explicitly out of scope (preserve as-is):** the JeffOS windowing desktop, dock, Finder, apps, holiday themes, games/synth/terminal — untouched. We are adding a front door, not remodeling the house.

**Identity guardrail:** Recruiter Mode must *feel like JeffOS* — same OKLCH/shadcn token system ([src/index.css](src/index.css)), same craft, a tasteful nod to the OS (e.g. a faux "menu bar" header, subtle window-chrome motifs) — so it reads as "this person built that OS," not as a generic template.

---

## 2. Content source-of-truth & positioning

**Verified from the repo today:**
- Résumé file: `Jeffrey James Idodo PERN_Full_Stack_Developer.pdf` (served from the `portfolio` Storage bucket in [Recruiter.tsx](src/apps/recruiter/Recruiter.tsx); a second copy exists in `/public` via [MobileShell.tsx](src/shells/MobileShell/MobileShell.tsx) — **consolidate on the bucket**).
- Email: `jeffreyjidodo@gmail.com`
- GitHub: `github.com/whoistheedev`
- LinkedIn: `linkedin.com/in/jeffrey-james-idodo-4402b6390`
- Projects data: live `projects` table (name, slug, description, thumbnail_url, live_url, active) + `portfolio_thumb` bucket.

**Target positioning (authoritative for this design):**
> **Jeffrey James Idodo — Senior Software Engineer · EDI Pipeline Specialist · HealthTech / RCM Engineer.**
> Builds healthcare revenue-cycle (RCM) and EDI processing systems; multi-tenant Supabase architecture; React front-ends.

> ⚠️ **Content reconciliation note (for PM/Jeff):** the repo currently says only "Full-Stack Developer," and the résumé filename says "PERN Full Stack Developer." Before ship, update the résumé PDF, the `projects` rows, and any copy to match the Senior/EDI/RCM positioning so the front door, the PDF, and LinkedIn tell **one** story. The design below assumes that reconciliation happens.

---

## 3. Recruiter Home — answer 5 questions in <10 seconds

Every section maps to a recruiter question; the order is the scan order.

| Question | Section | Above-the-fold? |
|----------|---------|-----------------|
| Who is Jeffrey? | **Hero** (name, title, one-line value prop, headshot/avatar) | ✅ |
| What does he do? | **Current Role** + **Architecture Highlights** (§4.2) (Senior SWE · EDI · RCM) | ✅ (mobile: just below hero) |
| What has he built? | **Project showcase** (case-study cards) | partial (peek) |
| Why hire him? | **Current Impact** (§4.1) + **Skills** + **Architecture Highlights** (§4.2) | partial |
| Is he available (for what)? | **Open To** (§4.3) (roles · engagement · status) | ✅ (near hero + above Contact) |
| How do I contact him? | **Contact** (sticky CTA always visible) | ✅ (sticky) |

### 3.1 Hero
- **H1**: "Jeffrey James Idodo" · **H2**: "Senior Software Engineer — EDI & Healthcare RCM Systems."
- **One-liner**: "I build the pipelines that move healthcare claims and money — multi-tenant Supabase, EDI, React."
- **Primary CTA: "Schedule a Conversation"** · **Secondary CTA: "Download Résumé."**
- Subtle JeffOS signature: a faux menu-bar strip ("Jeff · File · View … 🕛") so the brand is felt instantly. A small **"Launch JeffOS"** affordance lives here too (see §10).

### 3.2 Experience section
Condensed timeline preview (3 most recent) → links to full **Experience Timeline** (§6).

### 3.3 Skills section
Grouped, not a tag soup — **by domain credibility**:
- **Healthcare/RCM**: claims, denials, ERA/835, EDI 837/834/270/271, RCM workflows.
- **Data/Backend**: Supabase (multi-tenant, RLS), Postgres, Edge Functions, pipelines.
- **Frontend**: React 19, TypeScript, state architecture, PWA.
- **Practices**: security, scalability, observability (cite the audits as proof of rigor).

### 3.4 Project showcase
3–5 case-study cards (§5), "BFLOW RCM" first. Card peek above the fold invites scroll.

### 3.5 Contact section
Full contact funnel (§8) + repeated primary CTA. On mobile this is also a **sticky bottom CTA**.

### 3.6 Insights
"Insights" section (§9) — gracefully empty today, scalable to 100+ later.

---

## 4. Current Role (credibility anchor)

A dedicated, scannable block — recruiters filter on *current* seniority and domain.

```
┌─ Current ───────────────────────────────────────────────┐
│ Senior Software Engineer · EDI Pipeline Specialist       │
│ HealthTech / Revenue Cycle Management (RCM)              │
│                                                          │
│ Responsibilities   Design & operate EDI ingestion +     │
│                    claims pipelines (837/835/834/270/271)│
│ Impact             ↑ claim throughput, ↓ denial rework, │
│                    automated reconciliation             │
│ Architecture       Multi-tenant Supabase, RLS isolation,│
│                    Edge Functions, event pipelines      │
│ Supabase expertise RLS, migrations, realtime, scaling   │
│ Healthcare         RCM domain, compliance-aware design  │
└──────────────────────────────────────────────────────────┘
```
> Impact statements must be **specific and verifiable** (numbers where allowed). Placeholders above → fill with real metrics during content reconciliation (§2).

### 4.1 Current Impact

A tight, **outcome-first** block — recruiters and hiring managers scan for proof that the work *moves numbers*, not just ships features. Lead with the result, not the task.

```
┌─ Current Impact ─────────────────────────────────────────┐
│ • Automated healthcare claims processing end-to-end       │
│   (837 submission → 835 reconciliation), cutting manual   │
│   touch and denial rework.                                │
│ • Built & operate multi-tenant EDI pipelines serving      │
│   multiple payers/clients on isolated Supabase tenants.   │
│ • Reduced revenue-cycle latency: faster claim-to-cash via │
│   automated reconciliation and exception handling.        │
│ • Hardened the data layer — RLS tenant isolation, tracked │
│   migrations, security/scalability audits (this repo).    │
└──────────────────────────────────────────────────────────┘
```
- **Format:** each line = *verb → system → measurable outcome.* Numbers wherever they can be shared (e.g. "↓ X% denial rework," "N payers onboarded," "↓ claim-to-cash by D days").
- **Why it converts:** answers "Why hire him?" with evidence, not adjectives. This is the block a CTO screenshots into a hiring thread.
- **Placement:** directly under Current Role on every device; above the project showcase (impact summary → then the case studies that prove it).
- ⚠️ **Content reconciliation (§2):** replace the illustrative bullets with Jeff's real, shareable metrics before ship.

### 4.2 Architecture Highlights

The **engineer-credibility** block — for the GitHub-sourced recruiter, the technical hiring manager, and the CTO who wants depth, not buzzwords. Frame as *decisions and trade-offs*, the signal of seniority.

```
┌─ Architecture Highlights ────────────────────────────────┐
│ Multi-Tenant Supabase   Per-tenant isolation via RLS;     │
│                         tracked migrations; least-priv.   │
│ EDI Pipelines           837/835/834/270/271 ingest →      │
│                         normalize → reconcile, event-driven│
│ Edge Functions          Server-authoritative writes,      │
│                         validation & secrets off-client   │
│ Data Integrity          RLS-enforced, advisor-clean,      │
│                         migration-tracked, observable     │
│ Frontend                React 19 + TS, PWA, code-split,    │
│                         capability-based responsive shells │
│ Scale posture           Indexed leaderboards/aggregates,  │
│                         CDN assets, realtime via counters  │
└──────────────────────────────────────────────────────────┘
```
- **Specializations surfaced:** Senior SWE · EDI Pipeline Specialist · Healthcare RCM · Multi-Tenant Supabase Architecture · React/TypeScript · Healthcare Claims Automation.
- **Why it converts:** demonstrates *architectural judgment* (RLS isolation, server-authoritative writes, migration discipline) — the difference between "writes React" and "owns systems." JeffOS itself is the proof: link the [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) and the security/scalability audits as evidence of how Jeff thinks.
- **Placement:** below Current Impact; collapsible on mobile (summary chips → expand) to protect the <10s scan and the perf budget.
- **Tone:** trade-off language ("isolated tenants via RLS *because*…"), not a tech-logo wall.

### 4.3 Open To

A short, explicit **availability** block — removes the recruiter's biggest pre-contact uncertainty ("is he even looking, and for what?") and pre-qualifies inbound so the conversations that land are the right ones.

```
┌─ Open To ────────────────────────────────────────────────┐
│ Roles      Senior Software Engineer · EDI / Healthcare    │
│            RCM · Multi-Tenant Supabase / Platform         │
│ Focus      Healthcare claims automation, EDI systems,     │
│            multi-tenant SaaS architecture                 │
│ Engagement Full-time · Contract · Consulting              │
│ Work mode  Remote · (location/timezone as applicable)     │
│ Status     Open to conversations  →  [Schedule a Conv.]   │
└──────────────────────────────────────────────────────────┘
```
- **Why it converts:** turns a passive reader into a qualified lead; a recruiter who sees "Open To: Contract · Healthcare RCM" and has that exact req books immediately. Reduces wasted outreach on both sides.
- **Wires to the funnel:** the status row's CTA is the same primary action as §8 ("Schedule a Conversation").
- **Placement:** near the top of Home (just under hero or in a sticky side-card on desktop) **and** repeated above the Contact section.
- ⚠️ **Content reconciliation (§2):** confirm engagement types, work mode, and current availability so the page never claims an outdated status.

> **IA note:** §4.1–§4.3 are additive credibility blocks *within* the existing Current-Role anchor. They do **not** alter the section order, the 5-question Home model (§3), the funnel inversion (§0), or any cross-device IA — Recruiter Mode stays the default; JeffOS stays the optional immersive experience.

---

## 5. Projects as Case Studies

Each card is a **mini case study**, expandable to a full detail view. Structure = the recruiter's mental model: *what was broken → what you did → how → with what → what changed.*

```
┌─ BFLOW RCM ──────────────────────────────── [Live] [Source] ┐
│ Problem      Manual, error-prone revenue-cycle workflows    │
│ Solution     Automated RCM platform (claims → payment)      │
│ Architecture Multi-tenant Supabase, RLS, Edge pipelines     │
│ Tech         React · TS · Supabase · Postgres · EDI         │
│ Outcome      ↓ manual touch, ↑ throughput, faster cash      │
└─────────────────────────────────────────────────────────────┘
```

**Priority order (most hire-relevant first):**
1. **BFLOW RCM** — flagship; healthcare + RCM + multi-tenant Supabase in one.
2. **Multi-Tenant Supabase Migration** — architecture depth (RLS, isolation, migrations).
3. **EDI Processing Platform** — domain specialty (837/835/834 pipelines).
4. **Healthcare Claims Automation** — measurable business impact.
5. **JeffOS** — engineering range + this very experience ("the OS you're looking at").

**Data binding:** cards render from the `projects` table (active) + `portfolio_thumb`. **Schema gap:** the current `projects` table has only name/slug/description/thumb/live_url — case studies need `problem`, `solution`, `architecture`, `tech_stack[]`, `outcome`, `featured`, `sort_order`. Add these columns in Phase 5/6 migrations (design-only note; no change applied here).

**Detail view:** tap/click → full case study (longer narrative, architecture diagram image, screenshots, links). Shell-agnostic component reused across mobile/tablet/desktop.

---

## 6. Experience Timeline

Recruiter-friendly = **reverse-chronological, skimmable, role + impact per entry.**

```
● 2026 — Senior Software Engineer (EDI / RCM)        ← Current (highlighted)
│        HealthTech · multi-tenant Supabase, EDI pipelines
│        ↳ key milestone: BFLOW RCM platform
│
○ 20XX — Full-Stack Developer
│        ↳ milestone …
│
○ 20XX — Earlier role / education
```
- **Current role visually emphasized** (accent border, "Current" badge).
- Each node: title · org · dates · 1–2 impact bullets · optional milestone chip.
- Collapsible older entries to keep it scannable; "View full résumé" link.

---

## 7. Résumé Experience

Four affordances, one source of truth (the `portfolio` bucket PDF):

| Mode | Design |
|------|--------|
| **Inline** | Embedded viewer (PDF or rendered pages) directly in Recruiter Mode — no download required to read |
| **Download PDF** | One-tap download; the secondary CTA everywhere |
| **Share link** | Web Share API on mobile (native sheet); copy-link fallback on desktop — recruiters forward easily |
| **Print** | Print-optimized stylesheet (no nav/CTAs/animations; clean A4/Letter) for the recruiter who prints to PDF |

- Fallback chain: PDF embed → rendered image pages → download link (handles blocked embeds / old browsers).
- Accessible name + text alternative for the viewer (§13).

---

## 8. Contact Funnel

**Primary CTA: "Schedule a Conversation."** **Secondary CTA: "Download Résumé."** Present on every screen.

```
┌─ Let's talk ─────────────────────────────┐
│ 📅  Schedule a Conversation   (primary)  │ → booking link (Calendly/Cal.com)
│ ✉   Email   jeffrey…@gmail.com  [copy]   │
│ in  LinkedIn                          →   │
│ ⌥   GitHub  (whoistheedev)            →   │
└───────────────────────────────────────────┘
```
- **Booking is the conversion goal** — a scheduling link removes the email-tag-back friction. (Dependency: pick a scheduler; design assumes one.)
- Email shows + copies (no mailto-only dead-ends on desktop).
- On mobile: contact = a `vaul` bottom sheet (already a dep) triggered by the sticky CTA.
- Every contact action is an **analytics event** (§12).

---

## 9. Insights (publications)

A section that is **dignified when empty** and **scalable when full**.

- **0 articles (today):** "Insights — writing on healthcare engineering, EDI, and Supabase architecture. Coming soon." + a "Notify me / follow on LinkedIn" link. No broken/empty grid.
- **1–100+ (later):** card grid with category filters: *Healthcare Engineering · EDI Systems · Supabase Architecture · Multi-Tenant SaaS · React Architecture.* Paginated/virtualized; searchable (Fuse.js, already a dep).
- **Data model (future):** an `insights` table (title, slug, excerpt, body/MDX ref, category, published_at, featured) + RLS public-read — design note only; not created here.

---

## 10. Cross-device experience

### 10.1 Mobile (designed first — the critical persona)
**One-thumb, bottom-tab, no OS chrome.**
```
┌───────────────────────┐
│ Jeff · Senior SWE     │  ← compact header (faux menu-bar nod)
│ EDI / Healthcare RCM  │
│ [Schedule a Convo]    │  ← primary CTA, above fold
│ [Download Résumé]     │
│ ── Current Role ──    │
│ ── Projects (peek) ── │
├───────────────────────┤
│ 🏠   ▣   ⏱   📄   ✉   │  ← bottom tabs (Tier-0 always reachable)
└───────────────────────┘
  Home Proj Exp Resume Contact
```
- **Tabs:** Home · Projects · Experience · Résumé · Contact.
- **No** desktop windows, **no** drag, **no** dock, **no** Finder. (JeffOS is reachable only via an explicit "Launch JeffOS" item under a "More"/header affordance.)
- Sticky primary CTA; safe-area insets; 44px targets; skeletons over spinners.
- Full-screen views, `vaul` sheets for contact/share.

### 10.2 Tablet (hybrid — professional-first, JeffOS optional)
- Recruiter Mode is the default surface: a **left rail** (Home/Projects/Experience/Résumé/Contact) + a single focused content pane (snap-to-half for "browse projects / preview case study").
- A persistent **"Launch JeffOS"** in the rail footer — optional immersive mode.
- Larger touch targets; same components as mobile, more space.

### 10.3 Desktop (Recruiter Mode → Launch JeffOS as a choice)
- **First paint = Recruiter Home**, not the OS. Hero + Current Role + Projects + Contact visible before any OS metaphor.
- A prominent, tasteful **"Launch JeffOS"** (hero + faux menu bar) enters the full desktop OS — a *deliberate, delightful choice*, framed as "Want to see the OS I built? Launch JeffOS."
- Once a visitor launches JeffOS, an **"← Exit to Résumé"** affordance returns them (mirrors the existing `showFullOS` escape-hatch pattern in [MobileShell.tsx](src/shells/MobileShell/MobileShell.tsx), inverted).
- **Routing:** Recruiter Mode is the default route for all new visitors; JeffOS launch is remembered per session so a returning engineer who chose the OS isn't re-walled (low-friction, still conversion-default for newcomers).

---

## 11. Recruiter Journeys (research-led)

| Persona / source | Goals | Questions | Friction (today) | Conversion path (target) |
|------------------|-------|-----------|------------------|--------------------------|
| **Recruiter from LinkedIn** | Confirm seniority + domain fit fast; get résumé | Senior? Healthcare/EDI real? Contactable? | Lands in OS, no résumé path | Land → Hero (title) → Current Role → Download/Schedule (<10s) |
| **Recruiter from GitHub** | Verify the work is real; see code | Does he ship? Architecture quality? | OS is fun but where's the signal? | Land → Projects (Source links) → JeffOS optional → Schedule |
| **Recruiter from Google** | Orient — who is this, is it credible? | What does he do? Legit? | Ambiguous; novelty-first | Land → Hero + Skills + Projects → Contact |
| **Potential client** | Can he solve *my* problem? | Built similar? Reliable? Reachable? | No service framing | Land → Case studies (Problem→Outcome) → "Schedule a Conversation" |

**Cross-cutting insight:** all four want **signal before novelty**. Recruiter Mode gives signal; JeffOS gives novelty to those who opt in. GitHub-sourced engineers are the one group likely to *want* the OS — surface "Launch JeffOS" a touch more prominently when referrer is GitHub (progressive, not required).

---

## 12. Conversion Optimization

| Lever | Design |
|-------|--------|
| **Primary CTA placement** | "Schedule a Conversation" in hero, sticky on mobile, repeated at Contact, and in the faux menu bar. Never more than a scroll away. |
| **Secondary CTA placement** | "Download Résumé" beside primary everywhere; also in résumé section. |
| **Résumé visibility** | Inline (readable without download) + download + share + print — zero dead-ends. |
| **Project visibility** | Case-study peek above the fold; "featured" project (BFLOW) first; clear Live/Source links. |
| **Friction removal** | Booking link instead of email-tag-back; copy-to-clipboard email; no boot-splash wall before signal. |
| **Trust signals** | Current Role block, measurable outcomes, "I also built this OS," live visitor count (once realtime fixed). |

**Goal: maximize interview/booking requests.** Every CTA is instrumented; the funnel is the product metric.

---

## 13. Accessibility (WCAG 2.1 AA minimum)

| Area | Requirement |
|------|-------------|
| **Keyboard** | Full operability: tab order matches visual order; CTAs/tabs/links reachable & activatable; visible focus ring (`--color-ring`); skip-to-content |
| **Screen reader** | Semantic landmarks (`header/nav/main`), labeled CTAs, tab roles, résumé viewer accessible name + text alternative, live region for toasts/visitor count |
| **Zoom** | Pinch-zoom preserved (already correct in [App.tsx](src/App.tsx)); reflow to 400% without loss (1.4.10) |
| **Reduced motion** | `prefers-reduced-motion` honored — hero/scroll/transition animations degrade to fades; JeffOS launch transition simplified |
| **Mobile a11y** | 44px targets, spacing to prevent mis-taps, bottom tabs labeled, sheets focus-trapped, safe-area aware |
| **Contrast** | Text + CTAs ≥4.5:1; a fixed `--color-hire` token (theme-independent) so the CTA stays AA across holiday themes |

**Gate:** axe-clean + manual keyboard + VoiceOver/TalkBack pass on the full recruiter path before ship.

---

## 14. Performance

Recruiter Mode is **lighter than JeffOS by design** (no windowing engine, no EmulatorJS/Synth on first paint), which is what makes the budget achievable.

| Requirement | Target | How |
|-------------|--------|-----|
| **Mobile load** | **< 2s** (mid-range Android / 4G) | Recruiter Mode = its own light entry chunk; JeffOS lazy-loaded **only** on "Launch" |
| **Lighthouse** | **95+** all categories | Above-the-fold is text+CTAs; no heavy asset blocks LCP; preconnect Supabase |
| **Offline** | Shell + last content cached | Existing PWA (Workbox CacheFirst assets / NetworkFirst docs); résumé PDF runtime-cached |
| **Lazy loading** | Aggressive | Project images lazy + blur-up; case-study detail on demand; JeffOS bundle excluded from Recruiter entry |
| **Reads** | Few, cached | `projects` via React Query (long staleTime); résumé from cached bucket URL |

> **Dependency:** the JeffOS boot cost (32 HEAD theme probes, ≤31 storage `list()` — see [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md)/[SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md)) must **not** run on Recruiter Mode first paint. Defer all theme/games discovery until "Launch JeffOS." This is the key architectural win of separating the front door from the OS.

---

## 15. Analytics

Track the full funnel; these are the PM/CTO review metrics.

| Event | Why |
|-------|-----|
| **Résumé downloads** | Core conversion proxy |
| **Project views** (+ which) | Which case studies resonate (BFLOW vs JeffOS) |
| **Contact clicks** (schedule / email / LinkedIn / GitHub) | Conversion by channel |
| **Time to first interaction** | Is the <10s promise met? |
| **JeffOS launches** | Novelty-seeker rate; engineer vs recruiter split |
| **Funnel completion** | Home → Résumé/Projects → Schedule |
| **Referrer** | LinkedIn/GitHub/Google/direct → tailor messaging |

Implementation: privacy-friendly event beacon (ties into the observability layer in [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) §12). No PII; anon only.

---

## 16. Component & routing architecture (design)

Reuses the existing `ResponsiveShellRouter` and shadcn primitives ([src/components/ui](src/components/ui): button, dialog, drawer, tabs, input, textarea, badge) + `vaul`, `fuse.js`.

```
<App>
└─ <RootRouter>                         ★NEW  (decides Recruiter Mode vs JeffOS; default = Recruiter)
   ├─ <RecruiterMode>                   ★NEW  (default first paint, light chunk)
   │  └─ <ResponsiveShellRouter form=recruiter>
   │     ├─ <RecruiterMobile> (bottom tabs)            ★NEW
   │     ├─ <RecruiterTablet> (rail + focus pane)      ★NEW
   │     └─ <RecruiterDesktop>(sections + Launch JeffOS)★NEW
   │     shared: <Hero> <CurrentRole> <CaseStudyCard/Detail>
   │             <ExperienceTimeline> <ResumeViewer> <ContactFunnel>
   │             <InsightsSection> <LaunchJeffOSCTA>   ★NEW
   │
   └─ <JeffOS> (existing DesktopShell/Tablet/Mobile)   ← lazy, loaded only on Launch
      └─ <ExitToResumeCTA>              ★NEW  (inverse of existing showFullOS hatch)
```
**Key boundary:** `RecruiterMode` and `JeffOS` are **separate lazy chunks**. Recruiter Mode never imports the windowing engine; JeffOS loads on demand. This is what protects the 2s/95+ budget.

---

## 17. Migration / rollout

| Stage | Ships | Risk |
|-------|-------|------|
| **Prep** | Reconcile content (§2): résumé PDF, `projects` rows + new case-study columns, real titles/metrics | none (content) |
| **Build** | RecruiterMode chunk + shared components; route default still JeffOS (behind flag) | none (dark-launched) |
| **Canary** | Flip default to Recruiter Mode for a % of new visitors; measure funnel vs control | low (flag revert) |
| **Launch** | Recruiter Mode default for all new visitors; JeffOS opt-in + remembered | low |
| **Iterate** | Insights, booking optimization, referrer-tailored messaging | none |

Rollback = flip the default flag back to JeffOS; chunks are independent so no entanglement.

---

## 18. Future Roadmap

Prioritized by **impact ↑, complexity ↓, conversion ↑**.

### Phase 6A — Recruiter Mode MVP (highest impact, lowest complexity)
- Recruiter Home (Hero, Current Role, Skills), Résumé experience (inline/download/share/print), Contact funnel with **"Schedule a Conversation,"** Projects as basic case-study cards, **Recruiter Mode as default + "Launch JeffOS" opt-in**, mobile bottom-tabs, analytics v1.
- *Impact: max (fixes the funnel). Complexity: medium. Conversion: highest single lever.*

### Phase 6B — Depth & credibility
- Full case-study detail views (architecture diagrams, screenshots), Experience Timeline, tablet rail/focus mode, referrer-aware messaging, conversion A/B on CTA copy/placement, booking integration tuning.
- *Impact: high. Complexity: medium. Conversion: compounding.*

### Phase 6C — Authority & scale
- **Insights** content system (0 → 100+ articles), search/filtering, SEO/OpenGraph for shareability, deeper analytics (funnel cohorts by referrer), print/share polish.
- *Impact: medium (long-term authority). Complexity: higher. Conversion: durable inbound.*

---

## 19. Open questions / dependencies
1. **Scheduler choice** (Cal.com / Calendly) for the primary CTA — booking link needed.
2. **Content reconciliation** (§2): confirm exact title, dates, employer, and **real impact metrics** for BFLOW/EDI/RCM before ship — treated as authoritative here, must be true on the page.
3. **Résumé single-source**: consolidate the `portfolio` bucket PDF vs the `/public` copy (recommend bucket).
4. **`projects` schema**: add `problem/solution/architecture/tech_stack/outcome/featured/sort_order` (Phase 5/6 migration).
5. **Default-routing memory**: confirm "remember JeffOS choice per session" vs per-device.

---

*This document is design-only. No code was written and no database or infrastructure changes were made or executed. JeffOS itself is preserved unchanged; Recruiter Mode is an additive front door governed by the staged rollout in §17.*
