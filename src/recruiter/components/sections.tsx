import { Calendar, ArrowUpRight, FolderGit2 } from "lucide-react"
import {
  IDENTITY,
  TRUST_INDICATORS,
  STAT_BAND,
  CURRENT_IMPACT,
  CURRENT_IMPACT_LEAD,
  CURRENT_IMPACT_CLOSING,
  ARCHITECTURE_HIGHLIGHTS,
  FEATURED_WORK,
  FEATURED_STATEMENT,
  WHY_HIRE,
  WHY_HIRE_SOLVES,
  WHY_HIRE_CLOSING,
  AVAILABLE_FOR,
  EXPERIENCE,
  EDUCATION,
  CONTACT,
} from "../content"

/**
 * Recruiter Mode sections — executive, systems-engineer altitude.
 * Aesthetic: minimal, monochrome + one accent, generous whitespace, hairline
 * cards, mono chips for metrics/EDI codes. No gradients, no glow.
 * All copy from content.ts.
 */

const scheduleHref = () =>
  CONTACT.schedulerUrl ?? `mailto:${CONTACT.email}?subject=Let's%20talk`

/* ------------------------------- primitives ------------------------------- */
export function CodeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] tracking-tight text-muted-foreground">
      {children}
    </span>
  )
}

function SectionShell({
  id,
  title,
  children,
}: {
  id?: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      {title && (
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border p-5 transition-colors hover:border-foreground/20 ${className}`}>
      {children}
    </div>
  )
}

/* --------------------------------- Hero ----------------------------------- */
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function Hero({
  onLaunchJeffOS,
  onViewProjects,
  showName = false,
}: {
  onLaunchJeffOS: () => void
  /**
   * Where "View Projects" goes. Defaults to in-page scroll to the Featured Work
   * section (#work). On mobile, Featured Work lives behind the Projects tab and
   * is NOT in the Home document, so the mobile layout passes a handler that
   * switches tabs instead — otherwise the button is inert (see findings).
   */
  onViewProjects?: () => void
  /**
   * Show the person's name above the headline. The desktop sidebar always shows
   * identity; mobile starts at the Hero, so mobile opts in to keep the name
   * above the fold for recruiters.
   */
  showName?: boolean
}) {
  return (
    <header className="flex flex-col gap-6 py-4">
      <div className="space-y-4">
        {showName && (
          <p className="text-sm font-medium text-muted-foreground">
            {IDENTITY.name} · {IDENTITY.title}
          </p>
        )}
        <h1 className="max-w-[20ch] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          {IDENTITY.headline}
        </h1>
        <p className="max-w-prose text-base text-muted-foreground">{IDENTITY.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Primary */}
        <a
          href={scheduleHref()}
          target={CONTACT.schedulerUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)", minHeight: "var(--touch-target-min)" }}
        >
          <Calendar size={16} aria-hidden /> Schedule a Conversation
        </a>
        {/* Secondary */}
        <button
          onClick={() => (onViewProjects ? onViewProjects() : scrollToId("work"))}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          <FolderGit2 size={16} aria-hidden /> View Projects
        </button>
        {/* Tertiary — quiet, never competes with Schedule */}
        <button
          onClick={onLaunchJeffOS}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Launch JeffOS →
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {TRUST_INDICATORS.map((t) => (
          <CodeChip key={t}>{t}</CodeChip>
        ))}
      </div>
    </header>
  )
}

/* ----------------------------- Proof of Impact ---------------------------- */
export function StatBand() {
  return (
    <section id="proof" className="scroll-mt-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
        {STAT_BAND.map((s) => (
          <div key={s.label} className="flex min-w-0 flex-col gap-1 bg-background p-4">
            <span className="font-mono text-base font-semibold leading-snug tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-lg">
              {s.value}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground [overflow-wrap:anywhere]">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------- Current Impact ----------------------------- */
export function CurrentImpact() {
  return (
    <SectionShell id="impact" title="Current Impact">
      <p className="mb-6 max-w-prose text-lg leading-relaxed">{CURRENT_IMPACT_LEAD}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {CURRENT_IMPACT.map((item) => (
          <Card key={item.title}>
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
            {item.codes && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.codes.map((c) => <CodeChip key={c}>{c}</CodeChip>)}
              </div>
            )}
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{CURRENT_IMPACT_CLOSING}</p>
    </SectionShell>
  )
}

/* ------------------------- Architecture Highlights ------------------------ */
export function ArchitectureHighlights() {
  return (
    <SectionShell id="architecture" title="Architecture Highlights">
      <div className="grid gap-4 sm:grid-cols-2">
        {ARCHITECTURE_HIGHLIGHTS.map((h) => (
          <Card key={h.title}>
            <h3 className="text-base font-medium">{h.title}</h3>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Problem</dt>
                <dd className="text-sm leading-relaxed">{h.problem}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Architecture</dt>
                <dd className="text-sm leading-relaxed">{h.architecture}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Business Impact</dt>
                <dd className="text-sm leading-relaxed text-foreground">{h.impact}</dd>
              </div>
            </dl>
            {h.codes && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {h.codes.map((c) => <CodeChip key={c}>{c}</CodeChip>)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}

/* -------------------------- Featured Achievement -------------------------- */
export function FeaturedAchievement({ onViewProjects }: { onViewProjects?: () => void }) {
  return (
    <section className="border-y border-border py-10">
      <p className="max-w-[32ch] text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
        {FEATURED_STATEMENT}
      </p>
      {/* Same pattern as the Hero "View Projects" CTA: Featured Work isn't in
          the mobile Home document (it's behind the Projects tab), so #work has
          no target there. Mobile passes a handler that switches tabs; desktop/
          tablet fall back to in-page scroll. */}
      <button
        onClick={() => (onViewProjects ? onViewProjects() : scrollToId("work"))}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "var(--color-hire)" }}
      >
        See how at BFLOW RCM <ArrowUpRight size={15} aria-hidden />
      </button>
    </section>
  )
}

/* ----------------------------- Why Hire Jeffrey --------------------------- */
export function WhyHire() {
  return (
    <SectionShell id="why" title="Why Hire Jeffrey">
      <div className="grid gap-4 sm:grid-cols-3">
        {WHY_HIRE.map((w) => (
          <Card key={w.title}>
            <h3 className="text-sm font-semibold">{w.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{w.detail}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {WHY_HIRE_SOLVES.map((s) => <CodeChip key={s}>{s}</CodeChip>)}
      </div>
      <p className="mt-6 max-w-prose text-lg font-medium leading-snug">{WHY_HIRE_CLOSING}</p>
    </SectionShell>
  )
}

/* ------------------------------ Featured Work ----------------------------- */
export function FeaturedWork() {
  return (
    <SectionShell id="work" title="Featured Work">
      <div className="space-y-4">
        {FEATURED_WORK.map((w) => (
          <Card key={w.slug} className={w.flagship ? "border-foreground/25" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium">{w.name}</h3>
                <p className="text-sm text-muted-foreground">{w.summary}</p>
              </div>
              {w.flagship && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)" }}>
                  Flagship
                </span>
              )}
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Problem">{w.problem}</Field>
              <Field label="Constraints">{w.constraints}</Field>
              <Field label="Architecture">{w.architecture}</Field>
              <Field label="Solution">{w.solution}</Field>
            </dl>
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-sm"><span className="font-medium">Outcome — </span><span className="text-muted-foreground">{w.outcome}</span></p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.tech.map((t) => <CodeChip key={t}>{t}</CodeChip>)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed">{children}</dd>
    </div>
  )
}

/* ------------------------------- Experience ------------------------------- */
export function ExperienceTimeline() {
  return (
    <SectionShell id="experience" title="Experience">
      <ol className="space-y-5">
        {EXPERIENCE.map((e, i) => (
          <li key={i} className="relative pl-5">
            <span
              className="absolute left-0 top-1.5 h-2 w-2 rounded-full"
              style={{ background: e.current ? "var(--color-hire)" : "var(--border)" }}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-medium">{e.role}</p>
              {e.current && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)" }}>
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{e.org} · {e.period}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          </li>
        ))}
      </ol>

      <h3 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Education</h3>
      <ul className="space-y-1 text-sm">
        {EDUCATION.map((ed, i) => (
          <li key={i} className="flex flex-wrap justify-between gap-2">
            <span><span className="font-medium">{ed.credential}</span> — {ed.org}</span>
            <span className="text-muted-foreground">{ed.period}</span>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

/* ------------------------------ Available For ----------------------------- */
export function AvailableFor() {
  return (
    <SectionShell id="available" title="Available For">
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_FOR.map((r) => (
          <span key={r} className="rounded-lg border border-border px-3 py-1.5 text-sm">{r}</span>
        ))}
      </div>
    </SectionShell>
  )
}

/* ----------------------------- JeffOS callout ----------------------------- */
export function JeffOSCallout({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  return (
    <SectionShell>
      <Card className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-medium">This entire site is an operating system I built from scratch.</h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Windowing, realtime, a security-audited Supabase backend, tracked migrations, PWA — the
          same rigor I bring to healthcare systems, turned on my own portfolio. It demonstrates
          systems thinking, frontend architecture, performance engineering, and platform design.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["Systems Thinking", "Frontend Architecture", "Performance Engineering", "Product Design", "Platform Design"].map((t) => (
            <CodeChip key={t}>{t}</CodeChip>
          ))}
        </div>
        <button
          onClick={onLaunchJeffOS}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          Want to see how I think as an engineer? Launch JeffOS <ArrowUpRight size={16} aria-hidden />
        </button>
      </Card>
    </SectionShell>
  )
}

