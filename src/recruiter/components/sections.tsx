import { Calendar, ArrowUpRight } from "lucide-react"
import {
  IDENTITY,
  TRUST_INDICATORS,
  CURRENT_IMPACT,
  ARCHITECTURE_HIGHLIGHTS,
  FEATURED_WORK,
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
export function Hero({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  return (
    <header className="flex flex-col gap-6 py-4">
      <div className="space-y-4">
        <h1 className="max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          {IDENTITY.headline}
        </h1>
        <p className="max-w-prose text-base text-muted-foreground">
          {IDENTITY.title} specializing in {IDENTITY.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={scheduleHref()}
          target={CONTACT.schedulerUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)", minHeight: "var(--touch-target-min)" }}
        >
          <Calendar size={16} aria-hidden /> Schedule a Conversation
        </a>
        <button
          onClick={onLaunchJeffOS}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          style={{ minHeight: "var(--touch-target-min)" }}
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

/* ----------------------------- Current Impact ----------------------------- */
export function CurrentImpact() {
  return (
    <SectionShell id="impact" title="Current Impact">
      <ul className="space-y-4">
        {CURRENT_IMPACT.map((item, i) => (
          <li key={i} className="flex items-baseline gap-3">
            {item.metric ? (
              <span className="shrink-0 font-mono text-sm font-medium text-foreground">{item.metric}</span>
            ) : (
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" aria-hidden />
            )}
            <span className="text-[15px] leading-relaxed">{item.text}</span>
          </li>
        ))}
      </ul>
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
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.detail}</p>
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}

/* ------------------------------ Featured Work ----------------------------- */
export function FeaturedWork() {
  return (
    <SectionShell id="work" title="Featured Work">
      <div className="space-y-4">
        {FEATURED_WORK.map((w) => (
          <Card key={w.slug}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium">{w.name}</h3>
                <p className="text-sm text-muted-foreground">{w.summary}</p>
              </div>
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
        <h2 className="text-lg font-medium">Built this operating-system-style portfolio from scratch.</h2>
        <p className="text-sm text-muted-foreground">Want to see how I think as an engineer?</p>
        <button
          onClick={onLaunchJeffOS}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          Launch JeffOS <ArrowUpRight size={16} aria-hidden />
        </button>
      </Card>
    </SectionShell>
  )
}

