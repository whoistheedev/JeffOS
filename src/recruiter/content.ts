/**
 * Recruiter Mode — single source of truth for all copy (Phase 6A).
 *
 * ⚠️⚠️ CONTENT TO CONFIRM BEFORE MERGE ⚠️⚠️
 * Per PHASE_6_RECRUITER_MODE.md §2/§19, the positioning below (Senior SWE /
 * EDI / RCM) and all impact metrics are PLACEHOLDERS. The repo currently only
 * says "Full-Stack Developer" and the résumé PDF is titled "PERN Full Stack
 * Developer". Nothing here is verified. Every `CONFIRM:` marker must be
 * replaced with real, accurate, shareable content before this ships, so the
 * front door, the résumé PDF, and LinkedIn tell ONE story.
 *
 * The scheduler link is also a placeholder — until a Cal.com/Calendly URL
 * exists, the primary CTA falls back to mailto (see SCHEDULER_URL).
 */

export const CONTACT = {
  email: "jeffreyjidodo@gmail.com",
  github: "https://github.com/whoistheedev",
  linkedin: "https://www.linkedin.com/in/jeffrey-james-idodo-4402b6390",
  /** CONFIRM: replace with a real Cal.com/Calendly URL. null => mailto fallback. */
  schedulerUrl: null as string | null,
}

export const IDENTITY = {
  name: "Jeffrey James Idodo",
  /** CONFIRM: exact current title. */
  title: "Senior Software Engineer",
  /** CONFIRM: subtitle / specialization line. */
  subtitle: "EDI Pipeline Specialist · Healthcare RCM",
  /** CONFIRM: one-line value prop. */
  tagline:
    "I build the pipelines that move healthcare claims and money — multi-tenant Supabase, EDI, React.",
  /** Résumé: served from the portfolio Storage bucket (canonical source). */
  resumeBucket: "portfolio",
  resumeFile: "Jeffrey James Idodo PERN_Full_Stack_Developer.pdf",
}

/** §4 Current Role */
export const CURRENT_ROLE = {
  title: "Senior Software Engineer · EDI Pipeline Specialist",
  org: "HealthTech / Revenue Cycle Management (RCM)", // CONFIRM: employer/org
  responsibilities:
    "Design & operate EDI ingestion + claims pipelines (837/835/834/270/271).", // CONFIRM
  architecture:
    "Multi-tenant Supabase, RLS isolation, Edge Functions, event pipelines.", // CONFIRM
}

/** §4.1 Current Impact — CONFIRM every metric (use real, shareable numbers). */
export const CURRENT_IMPACT: string[] = [
  "Automated healthcare claims processing end-to-end (837 → 835 reconciliation).", // CONFIRM
  "Built & operate multi-tenant EDI pipelines serving multiple payers/clients.", // CONFIRM
  "Reduced revenue-cycle latency: faster claim-to-cash via automated reconciliation.", // CONFIRM
  "Hardened the data layer — RLS tenant isolation, tracked migrations, audits.", // CONFIRM
]

/** §4.2 Architecture Highlights — decisions/trade-offs, the seniority signal. */
export const ARCHITECTURE_HIGHLIGHTS: { label: string; detail: string }[] = [
  { label: "Multi-Tenant Supabase", detail: "Per-tenant isolation via RLS; tracked migrations; least-privilege." },
  { label: "EDI Pipelines", detail: "837/835/834/270/271 ingest → normalize → reconcile, event-driven." },
  { label: "Edge Functions", detail: "Server-authoritative writes; validation & secrets off-client." },
  { label: "Data Integrity", detail: "RLS-enforced, advisor-clean, migration-tracked, observable." },
  { label: "Frontend", detail: "React 19 + TS, PWA, code-split, capability-based responsive shells." },
]

/** §4.3 Open To — pre-qualifies inbound. CONFIRM availability before ship. */
export const OPEN_TO = {
  roles: "Senior Software Engineer · EDI / Healthcare RCM · Platform", // CONFIRM
  focus: "Healthcare claims automation, EDI systems, multi-tenant SaaS", // CONFIRM
  engagement: "Full-time · Contract · Consulting", // CONFIRM
  workMode: "Remote", // CONFIRM
  status: "Open to conversations", // CONFIRM
}

/** §5 Skills — grouped by domain credibility (not a tag soup). */
export const SKILLS: { group: string; items: string[] }[] = [
  { group: "Healthcare / RCM", items: ["Claims", "Denials", "ERA/835", "EDI 837/834/270/271", "RCM workflows"] },
  { group: "Data / Backend", items: ["Supabase (multi-tenant, RLS)", "Postgres", "Edge Functions", "Pipelines"] },
  { group: "Frontend", items: ["React 19", "TypeScript", "State architecture", "PWA"] },
  { group: "Practices", items: ["Security", "Scalability", "Observability"] },
]

/**
 * §6 Experience timeline. CONFIRM dates/orgs/bullets.
 * Reverse-chronological; first entry is highlighted as current.
 */
export const EXPERIENCE: {
  current?: boolean
  period: string
  role: string
  org: string
  bullets: string[]
}[] = [
  {
    current: true,
    period: "2026 — Present", // CONFIRM
    role: "Senior Software Engineer (EDI / RCM)",
    org: "HealthTech", // CONFIRM
    bullets: ["Multi-tenant Supabase, EDI pipelines", "Flagship: BFLOW RCM platform"], // CONFIRM
  },
  {
    period: "20XX — 2026", // CONFIRM
    role: "Full-Stack Developer",
    org: "CONFIRM",
    bullets: ["CONFIRM milestone"],
  },
]

/**
 * Featured project case-study fallbacks (§5), most hire-relevant first.
 * NOTE: live `projects` rows are read at runtime; these provide the case-study
 * narrative the table doesn't carry yet (problem/solution/architecture/outcome).
 * CONFIRM all details. The `projects` table needs columns added in a later
 * migration (problem/solution/architecture/tech_stack/outcome/featured/sort_order).
 */
export const FEATURED_PROJECTS: {
  slug: string
  name: string
  problem: string
  solution: string
  architecture: string
  tech: string[]
  outcome: string
}[] = [
  {
    slug: "bflow-rcm",
    name: "BFLOW RCM", // CONFIRM
    problem: "Manual, error-prone revenue-cycle workflows.",
    solution: "Automated RCM platform (claims → payment).",
    architecture: "Multi-tenant Supabase, RLS, Edge pipelines.",
    tech: ["React", "TypeScript", "Supabase", "Postgres", "EDI"],
    outcome: "↓ manual touch, ↑ throughput, faster cash.", // CONFIRM real metric
  },
  // CONFIRM: Multi-Tenant Supabase Migration, EDI Processing Platform,
  // Healthcare Claims Automation, JeffOS — add as case studies.
]

/** §9 Insights — empty today, scalable later. */
export const INSIGHTS: { title: string; category: string; href: string }[] = []
export const INSIGHTS_CATEGORIES = [
  "Healthcare Engineering",
  "EDI Systems",
  "Supabase Architecture",
  "Multi-Tenant SaaS",
  "React Architecture",
]
