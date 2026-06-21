/**
 * Recruiter Mode — single source of truth for all copy.
 *
 * Executive positioning: a systems engineer who builds business-critical
 * healthcare infrastructure. EDI / RCM / HealthTech / multi-tenant work is REAL
 * and current (reflected on Upwork/LinkedIn; the PDF CV undersells it).
 *
 * All claims are verified real work.
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
  /** The narrative headline — systems, not frameworks. */
  headline: "Building the systems behind healthcare operations.",
  title: "Senior Software Engineer",
  subtitle:
    "EDI pipelines · healthcare automation · multi-tenant SaaS architecture · scalable business systems.",
  /** The one-line positioning. */
  tagline:
    "I design and build the systems that move critical business operations — healthcare, revenue cycle, EDI infrastructure, multi-tenant SaaS, Supabase architecture.",
}

/** Hero trust indicators (mono chips). */
export const TRUST_INDICATORS = [
  "Healthcare Systems",
  "EDI Infrastructure",
  "Supabase Architecture",
  "Multi-Tenant Platforms",
]

/**
 * Current Impact — what Jeffrey is doing TODAY, executive altitude.
 * `metric` renders as a mono chip; `text` is the outcome statement.
 */
export const CURRENT_IMPACT: { metric?: string; text: string }[] = [
  { metric: "50+", text: "Leading migration of healthcare databases into a unified multi-tenant platform." },
  { text: "Building HIPAA-aware healthcare workflows." },
  { metric: "837·835·277·999", text: "Designing EDI pipelines supporting core healthcare transaction sets." },
  { text: "Architecting healthcare revenue-cycle systems — claims, eligibility, payments, denials, reporting." },
  { text: "Improving operational scalability and data integrity across tenants." },
]

/** Architecture Highlights — 4 capability cards. */
export const ARCHITECTURE_HIGHLIGHTS: { title: string; detail: string; caseStudy?: string }[] = [
  {
    title: "Multi-Tenant Architecture",
    detail:
      "Consolidating dozens of isolated healthcare systems into a unified architecture using Supabase, RLS, and modern application patterns.",
    caseStudy: "multi-tenant-migration",
  },
  {
    title: "EDI Processing Infrastructure",
    detail:
      "Building automated claims-processing pipelines that transform healthcare transactions (837/835/277/999) into operational workflows.",
    caseStudy: "edi-automation",
  },
  {
    title: "Healthcare Revenue Cycle Systems",
    detail:
      "Designing systems that connect claims, eligibility, payments, denials, and reporting.",
    caseStudy: "bflow-rcm",
  },
  {
    title: "Supabase Architecture",
    detail:
      "Realtime systems, storage, Edge Functions, RLS, observability, and scalability planning.",
    caseStudy: "jeffos",
  },
]

/**
 * Featured Work — case-study format (Problem · Constraints · Architecture ·
 * Solution · Outcome). Outcomes, not screenshots.
 */
export const FEATURED_WORK: {
  slug: string
  name: string
  summary: string
  problem: string
  constraints: string
  architecture: string
  solution: string
  outcome: string
  tech: string[]
}[] = [
  {
    slug: "bflow-rcm",
    name: "BFLOW RCM Platform",
    summary: "Revenue-cycle automation for healthcare operations.",
    problem: "Healthcare revenue-cycle workflows were manual, fragmented, and error-prone across claims, payments, and denials.",
    constraints: "HIPAA-aware data handling; multi-tenant isolation; auditability; integration with existing healthcare transaction formats.",
    architecture: "Multi-tenant Supabase (RLS isolation), Edge Functions for server-authoritative processing, event-driven pipelines, signed-URL file handling.",
    solution: "Automated the revenue cycle end-to-end — claims → eligibility → payments → denials → reporting — as connected, auditable workflows.",
    outcome: "Reduced manual touch and rework; improved data integrity and operational scalability across tenants.",
    tech: ["Supabase", "PostgreSQL", "RLS", "Edge Functions", "Node.js", "EDI"],
  },
  {
    slug: "multi-tenant-migration",
    name: "Multi-Tenant Database Migration",
    summary: "Consolidating isolated healthcare systems into one platform.",
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
    org: "BFlow Solutions · Remote",
    bullets: [
      "Architecting healthcare revenue-cycle systems and EDI pipelines (837/835/277/999).",
      "Leading a multi-tenant migration of 50+ healthcare databases onto Supabase with RLS isolation.",
      "Owning HIPAA-aware workflows, secure data layers (RLS + RBAC), and serverless Edge processing.",
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
