/**
 * Recruiter experience — single source of truth for all copy.
 *
 * Rendered in two places from the same components (src/recruiter/profile):
 *   - the full-page front door (Recruiter Mode, the default first paint), and
 *   - the "Hire Me" window inside JeffOS (src/apps/recruiter).
 *
 * Positioning: a systems engineer building AI-powered healthcare
 * revenue-cycle infrastructure at BFLOW Solutions. EDI / RCM / multi-tenant /
 * AI-assisted automation is REAL, current work (reflected on Upwork/LinkedIn;
 * the PDF CV undersells it).
 *
 * Honesty rules: no invented metrics, customers or availability claims. Exact
 * numbers that are not yet verified carry a `CONFIRM` comment. Outcomes without
 * a verified number are written qualitatively.
 */

export const CONTACT = {
  email: "jeffreyjidodo@gmail.com",
  phone: "+234 706 252 2649",
  site: "https://whoisjeff.dev",
  github: "https://github.com/whoistheedev",
  linkedin: "https://www.linkedin.com/in/jeffrey-james-idodo-4402b6390",
  location: "Remote",
  /** Cal.com/Calendly URL. null => no "schedule" affordance is shown at all. */
  schedulerUrl: null as string | null,
}

/** The one primary action. The label says what it does: it opens an email. */
export const PRIMARY_CTA = {
  label: "Email Jeffrey",
  href: `mailto:${CONTACT.email}?subject=${encodeURIComponent("Let's work together")}`,
  hint: "Opens an email to Jeffrey",
}

/** No résumé file is published; recruiters request the PDF by email. */
export const RESUME_REQUEST_HREF = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Résumé request")}`

export const IDENTITY = {
  name: "Jeffrey James Idodo",
  initials: "JI",
  title: "Senior Software Engineer",
  org: "BFLOW Solutions",
  since: "Dec 2025",
  /** Hero statement — what he builds, in one line. */
  headline: "I build the AI-powered systems behind healthcare revenue cycles.",
  subtitle:
    "I turn healthcare claims and payment files (EDI 837/835/277/999) into automated, auditable workflows — on multi-tenant Supabase and PostgreSQL, with AI handling the repetitive steps.",
  /** Plain-English version for non-technical readers (Quick Look). */
  plainEnglish:
    "Builds the software that moves healthcare claims and payments — reliably, securely, and with AI handling the repetitive work.",
}

/**
 * Proof strip under the hero — three facts a recruiter can repeat. Every value
 * is already stated elsewhere in this file; nothing new is claimed here.
 */
export const PROOF: { value: string; label: string }[] = [
  { value: "4", label: "EDI transaction sets automated — 837, 835, 277 and 999" },
  // CONFIRM: 50+
  { value: "50+", label: "healthcare databases moving onto one multi-tenant platform" },
  { value: "200+", label: "network and system issues diagnosed and resolved" },
]

/** Role/engagement signal (hero Get Info panel + Quick Look). */
export const AVAILABLE_FOR = ["Senior and Staff Engineer roles", "HealthTech platforms", "Technical consulting", "Remote"]

/**
 * Featured Work — case-study format. The front door shows
 * Problem → Approach (`architecture`) → Outcome; the prerendered case-study
 * pages (scripts/prerender-projects.mts) also use constraints/solution.
 */
export const FEATURED_WORK: {
  slug: string
  name: string
  /** Short context label shown in the project index. */
  domain: string
  summary: string
  /**
   * Fuller 130–160 char meta description for the prerendered case-study page
   * (better SERP copy than the short `summary`, which stays the card subtitle).
   * Drawn from this entry's own problem/solution/outcome — no new claims.
   */
  seoDescription?: string
  problem: string
  constraints: string
  architecture: string
  solution: string
  outcome: string
  /** Title + ordered steps for the small diagram beside the case card. */
  flowTitle: string
  flow: string[]
  tech: string[]
  flagship?: boolean
}[] = [
  {
    slug: "bflow-rcm",
    name: "BFLOW RCM Platform",
    domain: "Healthcare · Revenue cycle",
    summary: "AI-powered revenue-cycle automation for healthcare operations.",
    seoDescription:
      "AI-assisted automation of the healthcare revenue cycle — claims, eligibility, payments, denials — on a multi-tenant, HIPAA-aware Supabase backend.",
    problem: "Healthcare revenue-cycle workflows were manual, fragmented, and error-prone across claims, payments, and denials.",
    constraints: "HIPAA-aware data handling; multi-tenant isolation; auditability; integration with existing EDI transaction formats.",
    architecture: "AI-assisted automation on a multi-tenant Supabase backend (RLS isolation), server-authoritative Edge Functions, and event-driven EDI pipelines.",
    solution: "Automated the revenue cycle end-to-end — claims → eligibility → payments → denials → reporting — with AI-assisted workflows over connected, auditable data.",
    outcome: "Claims, eligibility, payments and denials run through one connected, auditable pipeline — with AI taking the repetitive steps off people.",
    flowTitle: "Revenue cycle",
    flow: ["Claims", "Eligibility", "Payments", "Denials", "Reporting"],
    tech: ["AI/LLM", "Supabase", "PostgreSQL", "RLS", "Edge Functions", "EDI"],
    flagship: true,
  },
  {
    slug: "multi-tenant-migration",
    name: "Multi-Tenant Database Migration",
    domain: "Healthcare · Data platform",
    summary: "Consolidating isolated healthcare systems into one platform.",
    // CONFIRM: "50+ databases" is the user's stated figure; verify before quoting it elsewhere.
    seoDescription:
      "Migrating 50+ isolated healthcare databases into one RLS-isolated multi-tenant platform on Supabase — zero data loss and HIPAA-aware access control.",
    problem: "Dozens of isolated healthcare databases meant duplicated effort, inconsistent data, and no unified operational view.",
    constraints: "Zero data loss; tenant isolation; HIPAA-aware access control; migrate without disrupting live operations.",
    architecture: "Unified multi-tenant schema with Supabase Row-Level Security per tenant; tracked migrations; least-privilege access; data-integrity validation.",
    // CONFIRM: 50+
    solution: "Migrating 50+ healthcare databases into a single RLS-isolated multi-tenant platform.",
    outcome: "One schema and one access model replace dozens of separate databases — a foundation each new tenant plugs into.",
    flowTitle: "Migration path",
    flow: ["Isolated databases", "Tracked migrations", "Unified schema", "Row-Level Security per tenant"],
    tech: ["Supabase", "PostgreSQL", "RLS", "Migrations", "RBAC"],
  },
  {
    slug: "edi-automation",
    name: "EDI Automation Platform",
    domain: "Healthcare · Transactions",
    summary: "Turning healthcare transactions into operational workflows.",
    seoDescription:
      "Automated pipelines that parse healthcare EDI transactions (837/835/277/999) into normalized, auditable workflows on Supabase Edge Functions.",
    problem: "Healthcare EDI transactions (837/835/277/999) arrived as opaque files with no automated path into operations.",
    constraints: "Format fidelity; auditability; reliability; compliant handling of sensitive data.",
    architecture: "Ingestion → normalization → reconciliation pipelines on serverless Edge Functions, with audit trails and secure storage.",
    solution: "Automated claims-processing pipelines that parse and route 837/835/277/999 into normalized operational workflows.",
    outcome: "Transaction files once handled by hand now parse, route and reconcile automatically, with an audit trail at every step.",
    flowTitle: "EDI pipeline",
    flow: ["837 · 835 · 277 · 999", "Ingest", "Normalize", "Reconcile", "Operational workflow"],
    tech: ["EDI", "Supabase Edge Functions", "Node.js", "PostgreSQL"],
  },
  {
    slug: "jeffos",
    name: "JeffOS",
    domain: "Personal · Web operating system",
    summary: "An operating-system-style portfolio, built from scratch.",
    seoDescription:
      "An operating-system-style portfolio built from scratch: a React 19 windowing OS with a PWA, Supabase realtime, themes, and a security-hardened backend.",
    problem: "How do you prove engineering range, not just claim it?",
    constraints: "Real backend, real realtime, real performance/accessibility budgets — not a demo.",
    architecture: "React 19 windowing OS, capability-based responsive shells, Supabase realtime via a counter pattern, PWA, tracked migrations, security-hardened RLS.",
    solution: "A working web OS with apps, realtime visitor counts, themes, and a security/scalability-audited backend.",
    outcome: "The portfolio is the demo: a working web OS with windowing, a Dock, Spotlight and realtime, on a security-audited backend.",
    flowTitle: "Architecture",
    flow: ["React 19 window manager", "Apps · Dock · Spotlight", "Supabase realtime", "RLS-hardened backend"],
    tech: ["React 19", "TypeScript", "Supabase", "PWA", "Zustand"],
  },
]

/**
 * Skills — one row per area: a plain-English summary (for recruiters), the
 * technical specs behind a disclosure (for engineering managers), and the
 * case study that backs the claim (a FEATURED_WORK slug).
 */
export const SKILLS: {
  title: string
  summary: string
  specs: { label: string; value: string }[]
  evidence: string
}[] = [
  {
    title: "Backend & Data",
    summary: "Designs the APIs, databases and data pipelines a product runs on.",
    specs: [
      { label: "Languages", value: "TypeScript, JavaScript" },
      { label: "Runtime", value: "Node.js / Express, Supabase Edge Functions" },
      { label: "Data", value: "PostgreSQL, Supabase, tracked migrations" },
      { label: "Patterns", value: "Event-driven pipelines, multi-tenant schemas" },
    ],
    evidence: "edi-automation",
  },
  {
    title: "Security",
    summary: "Keeps each customer’s data separate and access tightly scoped.",
    specs: [
      { label: "Isolation", value: "Row-Level Security per tenant" },
      { label: "Access", value: "RBAC, least privilege" },
      { label: "Data handling", value: "HIPAA-aware; secrets off-client; signed URLs" },
    ],
    evidence: "multi-tenant-migration",
  },
  {
    title: "AI & Automation",
    summary: "Uses AI to take repetitive operational work off people, with an audit trail.",
    specs: [
      { label: "RCM", value: "AI-assisted claims, eligibility, denials, reconciliation" },
      { label: "Documents", value: "OCR + LLM extraction pipelines" },
      { label: "Integration", value: "Workflow automation across APIs" },
    ],
    evidence: "bflow-rcm",
  },
  {
    title: "Healthcare",
    summary: "Works directly in the industry’s formats and rules: EDI transactions, revenue cycle, HIPAA-aware design.",
    specs: [
      { label: "EDI", value: "837 · 835 · 277 · 999" },
      { label: "Operations", value: "Revenue cycle management" },
      { label: "Compliance", value: "HIPAA-aware system design" },
    ],
    evidence: "bflow-rcm",
  },
  {
    title: "Frontend & Product",
    summary: "Ships polished, accessible interfaces — this portfolio is one.",
    specs: [
      { label: "UI", value: "React 19, TypeScript, Tailwind CSS" },
      { label: "State", value: "Zustand, TanStack Query" },
      { label: "Platform", value: "PWA, performance and accessibility budgets" },
    ],
    evidence: "jeffos",
  },
]

/**
 * Experience — systems / leadership / ownership voice (not "years of React").
 * Roles reflect the real, current EDI/RCM/HealthTech work.
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
    period: "Dec 2025 – Present",
    role: "Senior Software Engineer",
    org: "BFLOW Solutions · Remote",
    bullets: [
      "Build AI-assisted revenue-cycle automation across claims, eligibility, denials and reconciliation.",
      "Build the EDI infrastructure that turns 837/835/277/999 transactions into operational workflows.",
      // CONFIRM: 50+
      "Lead the migration of 50+ healthcare databases onto one multi-tenant Supabase platform with RLS isolation.",
      "Design HIPAA-aware data layers (RLS and RBAC) and serverless Edge processing.",
    ],
  },
  {
    period: "May 2025 – Sep 2025",
    role: "Project & Technology Officer",
    org: "Eastley Park Limited",
    bullets: [
      "Designed automation and multi-system data workflows through API integrations.",
      "Owned backend process design and documentation so the team could scale.",
    ],
  },
  {
    period: "Jun 2022 – Aug 2024",
    role: "Project Manager / Automation Engineer",
    org: "Fobat Properties",
    bullets: [
      "Led database-driven reporting systems that improved accuracy and auditability.",
      "Owned backend-dependent projects from requirements through delivery.",
    ],
  },
  {
    period: "May 2016 – Oct 2017",
    role: "Network Operations Engineer",
    org: "Suburban Fibreco",
    bullets: [
      "Held 99% SLA uptime for enterprise clients.",
      "Diagnosed and resolved 200+ network and system issues.",
    ],
  },
]

export const EDUCATION: { credential: string; org: string; period: string }[] = [
  { credential: "B.Sc. Computer Science", org: "Redeemer's University", period: "2015 – 2019" },
  { credential: "Full-Stack Web Development", org: "New Horizons Nigeria", period: "2025" },
]

/** Lookup helper used by skill evidence links and Quick Look. */
export function workBySlug(slug: string) {
  return FEATURED_WORK.find((w) => w.slug === slug)
}
