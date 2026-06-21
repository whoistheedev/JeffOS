/**
 * Recruiter Mode — single source of truth for all copy (Phase 6B).
 *
 * Reconciled to the REAL CV (Jeffrey Idodo_CV.pdf): Backend Engineer, 4 years,
 * HealthTech-focused, seeking part-time backend contracts.
 *
 * POSITIONING GUARDRAIL (see HIGH_LEVEL_PHASE_6B_6C_IMPLEMENTATION.md "Positioning
 * truth"): the core is CV-true (Backend / Supabase / HealthTech). EDI / RCM /
 * clinical-API / EHR are ASPIRATIONAL — kept in OPEN_TO.targeting and labeled as
 * a direction, never implied as held experience. Do not move them into Current
 * Role / Impact / Experience.
 */

export const CONTACT = {
  email: "jeffreyjidodo@gmail.com",
  phone: "+234 706 252 2649",
  site: "https://whoisjeff.dev",
  github: "https://github.com/whoistheedev",
  linkedin: "https://www.linkedin.com/in/jeffrey-james-idodo-4402b6390",
  location: "Lagos, Nigeria",
  /** TODO: add a Cal.com/Calendly URL. null => mailto fallback. */
  schedulerUrl: null as string | null,
}

export const IDENTITY = {
  name: "Jeffrey James Idodo",
  title: "Backend Engineer",
  subtitle: "HealthTech · Supabase · Secure APIs & Automation",
  tagline:
    "Backend engineer with 4 years building secure, scalable APIs, data pipelines, and automation — Node.js, Supabase (RLS/Auth/Edge), PostgreSQL. Available for part-time backend contracts in HealthTech.",
  /** Résumé served from /public (PWA-precached). Real current CV. */
  resumeUrl: "/Jeffrey Idodo_CV.pdf",
}

/** §4 Current Role — BFlow Solutions (from CV). */
export const CURRENT_ROLE = {
  title: "Senior Full-Stack Engineer",
  org: "BFlow Solutions · California, USA (remote) · Dec 2025 – Present",
  responsibilities:
    "Scalable backend systems with Node.js, Supabase, and serverless architectures for internal tools and client-facing platforms.",
  architecture:
    "Secure data-access layers via Supabase RLS + role-based permissions; signed-URL workflows and Edge Functions for compliant, auditable file handling.",
}

/** §4.1 Current Impact — outcome-first, all from the CV. */
export const CURRENT_IMPACT: string[] = [
  "Built secure data-access layers (Supabase RLS + RBAC) — directly applicable to patient-data protection in HealthTech.",
  "Developed signed-URL workflows and serverless Edge Functions for compliant, auditable file handling.",
  "Architected automated backend documentation systems to accelerate onboarding and enforce API consistency.",
  "Prior roles: improved operational efficiency 20%, cut data-processing delays 25%, maintained 99% SLA uptime.",
]

/** §4.2 Architecture Highlights — decisions/tradeoffs, CV-grounded. */
export const ARCHITECTURE_HIGHLIGHTS: { label: string; detail: string }[] = [
  { label: "Supabase Architecture", detail: "RLS isolation, Auth, Storage, Edge Functions, signed-URL workflows." },
  { label: "Secure Data Layers", detail: "Role-based access control (RBAC); compliant, auditable file handling." },
  { label: "Automation Pipelines", detail: "Node.js + REST/serverless; reporting & workflow automation." },
  { label: "OCR + LLM Pipelines", detail: "Document extraction with OCR + OpenAI (Slippiggy)." },
  { label: "DevOps & Docs", detail: "CI/CD (GitHub Actions, Vercel/Render); automated API documentation." },
]

/**
 * §4.3 Open To — pre-qualifies inbound. `targeting` holds the ASPIRATIONAL
 * direction (HealthTech data / clinical APIs / EHR-EMR / EDI / RCM) — render it
 * under a "Targeting" label, distinct from current skills.
 */
export const OPEN_TO = {
  roles: "Backend Engineer · Supabase / API · HealthTech backend",
  focus: "Health data pipelines, secure APIs, automation, OCR/LLM ingestion",
  engagement: "Part-time contracts · 10–25 hrs/week",
  workMode: "Remote",
  status: "Open to part-time backend contracts",
  /** Aspirational — labeled as direction, NOT experience. */
  targeting: "Clinical API integrations · EHR/EMR connectivity · health-data pipelines · EDI / RCM systems",
}

/** §5 Skills — grouped by domain credibility (all from the CV). */
export const SKILLS: { group: string; items: string[] }[] = [
  { group: "Backend & APIs", items: ["Node.js", "Express.js", "REST", "GraphQL", "Serverless (Supabase Edge, Vercel)"] },
  { group: "Databases & Auth", items: ["PostgreSQL", "Supabase (RLS/Auth/Storage)", "MongoDB", "Row-Level Security", "Signed URLs"] },
  { group: "HealthTech-relevant", items: ["Health data pipelines", "OCR for documents", "LLM data extraction", "Audit-trail design", "RBAC", "Secure file handling"] },
  { group: "DevOps & AI", items: ["CI/CD", "GitHub Actions", "Vercel/Render", "OpenAI API", "HuggingFace", "OCR pipelines"] },
]

/** §6 Experience timeline — real roles/dates from the CV (reverse-chronological). */
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
    role: "Senior Full-Stack Engineer",
    org: "BFlow Solutions · California, USA (remote)",
    bullets: [
      "Scalable backend systems (Node.js, Supabase, serverless) for internal & client-facing platforms.",
      "Secure data-access via Supabase RLS + RBAC; signed-URL + Edge Function file handling.",
      "Automated backend documentation systems for onboarding & API consistency.",
    ],
  },
  {
    period: "May 2025 – Sep 2025",
    role: "Project & Technology Officer",
    org: "Eastley Park Limited · Lagos, Nigeria",
    bullets: [
      "Built internal automation tools (Node.js + REST APIs) — +20% operational efficiency.",
      "Documented backend processes & API flows; designed multi-system data workflows.",
    ],
  },
  {
    period: "Jun 2022 – Aug 2024",
    role: "Project Manager / Automation Engineer",
    org: "Fobat Properties · Ibadan, Nigeria",
    bullets: [
      "Automated reporting pipelines (Node.js) — −25% data-processing delays.",
      "Structured database-driven reporting; improved accuracy & auditability.",
    ],
  },
  {
    period: "May 2016 – Oct 2017",
    role: "Network Operations Engineer",
    org: "Suburban Fibreco · Abuja, Nigeria",
    bullets: [
      "Maintained 99% SLA uptime for enterprise clients.",
      "Diagnosed & resolved 200+ network/system issues.",
    ],
  },
]

/** §6 Education (from CV). */
export const EDUCATION: { credential: string; org: string; period: string }[] = [
  { credential: "B.Sc. Computer Science", org: "Redeemer's University", period: "2015 – 2019" },
  { credential: "Full-Stack Web Development", org: "New Horizons Nigeria", period: "2025" },
]

/**
 * Featured project case-study fallbacks (§5), most relevant first.
 * Live `projects` rows render at runtime; these carry the case-study narrative
 * the table doesn't hold yet (added by a later migration). All from the CV.
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
    slug: "slippiggy",
    name: "Slippiggy — AI Document Processing & Data Pipeline",
    problem: "Manual extraction & categorization of document data is slow and error-prone.",
    solution: "End-to-end OCR + LLM pipeline for automated extraction and categorization.",
    architecture: "Serverless backend (Supabase Edge Functions) with secure, compliant storage & retrieval; full API/onboarding docs.",
    tech: ["Node.js", "Supabase Edge Functions", "OCR", "OpenAI API", "PostgreSQL", "Vercel"],
    outcome: "Automated receipt/document extraction — transferable to clinical document digitisation & health-record ingestion.",
  },
  {
    slug: "dev-tooling-suite",
    name: "Developer Documentation & Backend Tooling Suite",
    problem: "Backend docs drift and break, hurting onboarding and auditability.",
    solution: "Automation scripts: markdown link validator, code-example synchronizer, automated formatter.",
    architecture: "Composable Node.js tooling integrated into CI for maintainable, auditable docs.",
    tech: ["Node.js", "GitHub Actions", "Markdown"],
    outcome: "Documentation discipline & maintainability — critical in regulated HealthTech environments.",
  },
  // Live `projects` rows (e.g. "Mac Portfolio OS" / JeffOS, "Slippiggy") match
  // by slug where present; JeffOS itself is the engineering-range showcase.
]

/** §9 Insights — empty today, scalable later. */
export const INSIGHTS: { title: string; category: string; href: string }[] = []
export const INSIGHTS_CATEGORIES = [
  "Engineering",
  "HealthTech",
  "Supabase",
  "Architecture",
  "Career",
]
