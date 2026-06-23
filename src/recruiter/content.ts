/**
 * Recruiter Mode — single source of truth for all copy.
 *
 * Positioning: a systems engineer building AI-powered healthcare
 * revenue-cycle infrastructure at BFLOW Solutions. EDI / RCM / multi-tenant /
 * AI-assisted automation is REAL, current work (reflected on Upwork/LinkedIn;
 * the PDF CV undersells it). All claims are verified.
 *
 * Anchor: BFLOW Solutions appears in hero, current impact, experience, and
 * case studies — the strongest credibility signal.
 */

export const CONTACT = {
  email: "jeffreyjidodo@gmail.com",
  phone: "+234 706 252 2649",
  site: "https://whoisjeff.dev",
  github: "https://github.com/whoistheedev",
  linkedin: "https://www.linkedin.com/in/jeffrey-james-idodo-4402b6390",
  location: "Remote",
  /** TODO: add a Cal.com/Calendly URL. null => mailto fallback. */
  schedulerUrl: null as string | null,
}

export const IDENTITY = {
  name: "Jeffrey James Idodo",
  /** The narrative headline — AI-powered RCM, not frameworks. */
  headline: "Building AI-Powered Revenue Cycle Management Systems",
  title: "Senior Software Engineer",
  org: "BFLOW Solutions",
  subtitle:
    "Senior Software Engineer at BFLOW Solutions — modernizing healthcare operations through AI-assisted automation, EDI infrastructure, and scalable multi-tenant platforms.",
  /** Short sidebar line. */
  tagline:
    "AI-assisted healthcare automation · revenue cycle management · EDI infrastructure · multi-tenant Supabase architecture.",
}

/** Hero trust indicators (mono chips). */
export const TRUST_INDICATORS = [
  "AI-Powered RCM",
  "EDI 837/835/277/999",
  "Multi-Tenant",
  "HIPAA-Aware",
]

/**
 * Proof of Impact — the stat band. Big, credible figures (not vanity metrics).
 * `value` is the headline number/phrase; `label` is the terse descriptor.
 */
export const STAT_BAND: { value: string; label: string }[] = [
  { value: "50+", label: "Healthcare databases" },
  { value: "4", label: "EDI transaction types" },
  { value: "AI-Powered", label: "RCM automation" },
  { value: "Multi-Tenant", label: "Architecture" },
  { value: "HIPAA-Aware", label: "Systems" },
]

/** The EDI transaction codes — shown as chips (Current Impact + EDI card). */
export const EDI_CODES = ["837", "835", "277", "999"]

/**
 * Current Impact — what Jeffrey is building TODAY at BFLOW, executive altitude.
 * A lead sentence + a 2×2 grid of outcome cells.
 */
export const CURRENT_IMPACT_LEAD =
  "At BFLOW Solutions, I build the AI-powered systems that run healthcare revenue-cycle operations — automating claims, modernizing legacy platforms, and scaling a multi-tenant architecture dozens of practices depend on."

export const CURRENT_IMPACT: { title: string; detail: string; codes?: string[] }[] = [
  { title: "AI-powered RCM automation", detail: "Claims, eligibility, denials, and reconciliation driven by AI-assisted workflows." },
  { title: "EDI transaction infrastructure", detail: "Core healthcare transaction sets ingested and turned into operational flows.", codes: ["837", "835", "277", "999"] },
  { title: "Legacy platform modernization", detail: "Consolidating fragmented healthcare systems into one modern platform." },
  { title: "Multi-tenant architecture", detail: "RLS-isolated tenancy so 50+ practices share infrastructure, never data." },
]

export const CURRENT_IMPACT_CLOSING = "Built for scale, data integrity, and audit from day one."

/**
 * Architecture Highlights — outcome cards (Problem · Architecture · Business Impact).
 */
export const ARCHITECTURE_HIGHLIGHTS: {
  title: string
  problem: string
  architecture: string
  impact: string
  codes?: string[]
  caseStudy?: string
}[] = [
  {
    title: "AI-Powered Revenue Cycle Platform",
    problem: "Revenue-cycle work is manual, slow, and error-prone — claims, denials, and reconciliation eat staff hours.",
    architecture: "AI-assisted automation over a Supabase backend; event-driven pipelines; server-authoritative Edge Functions.",
    impact: "Less manual touch, faster claim-to-cash, fewer denials slipping through.",
    caseStudy: "bflow-rcm",
  },
  {
    title: "Healthcare Claims Automation",
    problem: "Claims arrive as opaque EDI files with no automated path into operations.",
    architecture: "AI-assisted parsing + normalization of 837/835/277/999 into structured, auditable workflows.",
    impact: "Claims processed faster and more accurately, with a full audit trail.",
    caseStudy: "edi-automation",
  },
  {
    title: "EDI Processing Infrastructure",
    problem: "Healthcare transactions must be exchanged reliably and compliantly across payers.",
    architecture: "Ingestion → normalization → reconciliation pipelines on serverless Edge Functions; secrets off-client.",
    impact: "Reliable, compliant transaction exchange operations can trust.",
    codes: ["837", "835", "277", "999"],
    caseStudy: "edi-automation",
  },
  {
    title: "Multi-Tenant Healthcare Architecture",
    problem: "Dozens of isolated systems duplicate effort and fragment data.",
    architecture: "One platform, Supabase RLS tenant isolation, tracked migrations, least-privilege access.",
    impact: "50+ practices on shared infrastructure with provable data isolation — scales without re-architecting.",
    caseStudy: "multi-tenant-migration",
  },
]

/** Featured Achievement — the one quotable statement. */
export const FEATURED_STATEMENT =
  "Helping modernize healthcare revenue-cycle operations — through AI-assisted automation, EDI infrastructure, and multi-tenant platform architecture."

/** Why Hire Jeffrey — problems he removes (conversion closer). */
export const WHY_HIRE: { title: string; detail: string }[] = [
  { title: "He builds AI-powered RCM, end to end", detail: "Claims, denials, eligibility, reconciliation — automated, not just digitized." },
  { title: "He speaks healthcare and infrastructure", detail: "EDI, RCM, HIPAA constraints, multi-tenant scale — no translation layer between domain and code." },
  { title: "He modernizes without breaking operations", detail: "Legacy consolidation and migrations that ship audit-ready: RLS, tracked migrations, observability." },
]

export const WHY_HIRE_SOLVES = [
  "AI-Powered RCM",
  "Healthcare Automation",
  "EDI Infrastructure",
  "Revenue-Cycle Optimization",
  "Multi-Tenant SaaS",
  "Platform Modernization",
  "Workflow Automation",
]

export const WHY_HIRE_CLOSING =
  "If your healthcare platform needs AI-driven automation that scales and survives an audit — that's the work I do."

/**
 * Featured Work — case-study format (Problem · Constraints · Architecture ·
 * Solution · Outcome). Outcomes, not screenshots.
 */
export const FEATURED_WORK: {
  slug: string
  name: string
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
  tech: string[]
  flagship?: boolean
}[] = [
  {
    slug: "bflow-rcm",
    name: "BFLOW RCM Platform",
    summary: "AI-powered revenue-cycle automation for healthcare operations.",
    seoDescription:
      "AI-assisted automation of the healthcare revenue cycle — claims, eligibility, payments, denials — on a multi-tenant, HIPAA-aware Supabase backend.",
    problem: "Healthcare revenue-cycle workflows were manual, fragmented, and error-prone across claims, payments, and denials.",
    constraints: "HIPAA-aware data handling; multi-tenant isolation; auditability; integration with existing EDI transaction formats.",
    architecture: "AI-assisted automation on a multi-tenant Supabase backend (RLS isolation), server-authoritative Edge Functions, and event-driven EDI pipelines.",
    solution: "Automated the revenue cycle end-to-end — claims → eligibility → payments → denials → reporting — with AI-assisted workflows over connected, auditable data.",
    outcome: "Less manual touch and rework; faster claim-to-cash; improved data integrity and operational scale across tenants.",
    tech: ["AI/LLM", "Supabase", "PostgreSQL", "RLS", "Edge Functions", "EDI"],
    flagship: true,
  },
  {
    slug: "multi-tenant-migration",
    name: "Multi-Tenant Database Migration",
    summary: "Consolidating isolated healthcare systems into one platform.",
    seoDescription:
      "Migrating 50+ isolated healthcare databases into one RLS-isolated multi-tenant platform on Supabase — zero data loss and HIPAA-aware access control.",
    problem: "Dozens of isolated healthcare databases meant duplicated effort, inconsistent data, and no unified operational view.",
    constraints: "Zero data loss; tenant isolation; HIPAA-aware access control; migrate without disrupting live operations.",
    architecture: "Unified multi-tenant schema with Supabase Row-Level Security per tenant; tracked migrations; least-privilege access; data-integrity validation.",
    solution: "Migrating 50+ healthcare databases into a single RLS-isolated multi-tenant platform.",
    outcome: "Unified architecture, consistent data integrity, and a foundation that scales with new tenants.",
    tech: ["Supabase", "PostgreSQL", "RLS", "Migrations", "RBAC"],
  },
  {
    slug: "edi-automation",
    name: "EDI Automation Platform",
    summary: "Turning healthcare transactions into operational workflows.",
    seoDescription:
      "Automated pipelines that parse healthcare EDI transactions (837/835/277/999) into normalized, auditable workflows on Supabase Edge Functions.",
    problem: "Healthcare EDI transactions (837/835/277/999) arrived as opaque files with no automated path into operations.",
    constraints: "Format fidelity; auditability; reliability; compliant handling of sensitive data.",
    architecture: "Ingestion → normalization → reconciliation pipelines on serverless Edge Functions, with audit trails and secure storage.",
    solution: "Automated claims-processing pipelines that parse and route 837/835/277/999 into normalized operational workflows.",
    outcome: "Faster, auditable claims processing replacing manual transaction handling.",
    tech: ["EDI", "Supabase Edge Functions", "Node.js", "PostgreSQL"],
  },
  {
    slug: "jeffos",
    name: "JeffOS",
    summary: "An operating-system-style portfolio, built from scratch.",
    seoDescription:
      "An operating-system-style portfolio built from scratch: a React 19 windowing OS with a PWA, Supabase realtime, themes, and a security-hardened backend.",
    problem: "How do you prove engineering range, not just claim it?",
    constraints: "Real backend, real realtime, real performance/accessibility budgets — not a demo.",
    architecture: "React 19 windowing OS, capability-based responsive shells, Supabase realtime via a counter pattern, PWA, tracked migrations, security-hardened RLS.",
    solution: "A working web OS with apps, realtime visitor counts, themes, and a security/scalability-audited backend.",
    outcome: "Proof of systems thinking — the portfolio is itself the engineering demo.",
    tech: ["React 19", "TypeScript", "Supabase", "PWA", "Zustand"],
  },
]

/** Available For — role/engagement signal. */
export const AVAILABLE_FOR = [
  "Senior Software Engineer",
  "Staff Engineer",
  "HealthTech Engineering",
  "Supabase Architecture",
  "EDI Platforms",
  "Technical Consulting",
  "Remote Opportunities",
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
      "Building AI-powered revenue-cycle automation — claims, denials, eligibility, reconciliation.",
      "EDI transaction infrastructure — 837/835/277/999 into operational workflows.",
      "Leading a multi-tenant migration of 50+ healthcare databases onto Supabase with RLS isolation.",
      "HIPAA-aware secure data layers (RLS + RBAC) and serverless Edge processing.",
    ],
  },
  {
    period: "May 2025 – Sep 2025",
    role: "Project & Technology Officer",
    org: "Eastley Park Limited",
    bullets: [
      "Designed automation + multi-system data workflows via API integrations.",
      "Owned backend process design and documentation for team scalability.",
    ],
  },
  {
    period: "Jun 2022 – Aug 2024",
    role: "Project Manager / Automation Engineer",
    org: "Fobat Properties",
    bullets: [
      "Led database-driven reporting systems; improved accuracy and auditability.",
      "Owned backend-dependent projects from requirements through delivery.",
    ],
  },
  {
    period: "May 2016 – Oct 2017",
    role: "Network Operations Engineer",
    org: "Suburban Fibreco",
    bullets: [
      "Maintained 99% SLA uptime for enterprise clients — reliability-engineering discipline.",
      "Diagnosed and resolved 200+ network/system issues.",
    ],
  },
]

/** §6 Education. */
export const EDUCATION: { credential: string; org: string; period: string }[] = [
  { credential: "B.Sc. Computer Science", org: "Redeemer's University", period: "2015 – 2019" },
  { credential: "Full-Stack Web Development", org: "New Horizons Nigeria", period: "2025" },
]

/** Insights — empty today, scalable later. */
export const INSIGHTS: { title: string; category: string; href: string }[] = []
export const INSIGHTS_CATEGORIES = [
  "Engineering",
  "HealthTech",
  "EDI",
  "Supabase",
  "Architecture",
  "Career",
]
