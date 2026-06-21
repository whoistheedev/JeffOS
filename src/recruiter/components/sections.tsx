import { Calendar, Download } from "lucide-react"
import {
  IDENTITY,
  CURRENT_ROLE,
  CURRENT_IMPACT,
  ARCHITECTURE_HIGHLIGHTS,
  OPEN_TO,
  SKILLS,
  EXPERIENCE,
  INSIGHTS,
  INSIGHTS_CATEGORIES,
  CONTACT,
} from "../content"
import { supabase } from "../../lib/supabase"

/**
 * Static Recruiter Mode sections (§3–§9). Shell-agnostic: composed by
 * RecruiterMode for each form factor. All copy comes from content.ts (which
 * carries the CONFIRM placeholders).
 */

function resumeUrl() {
  return supabase.storage.from(IDENTITY.resumeBucket).getPublicUrl(IDENTITY.resumeFile).data
    ?.publicUrl
}

export function Hero({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  const scheduleHref = CONTACT.schedulerUrl ?? `mailto:${CONTACT.email}?subject=Let's%20talk`
  return (
    <header className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{IDENTITY.name}</h1>
        {/* CONFIRM: title / subtitle / tagline in content.ts */}
        <p className="mt-1 text-lg font-medium">{IDENTITY.title}</p>
        <p className="text-muted-foreground">{IDENTITY.subtitle}</p>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">{IDENTITY.tagline}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={scheduleHref}
          target={CONTACT.schedulerUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)", minHeight: "var(--touch-target-min)" }}
        >
          <Calendar size={16} aria-hidden /> Schedule a Conversation
        </a>
        <a
          href={resumeUrl() ?? "#"}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          <Download size={16} aria-hidden /> Download Résumé
        </a>
        <button
          onClick={onLaunchJeffOS}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          Launch JeffOS →
        </button>
      </div>
    </header>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function CurrentRole() {
  return (
    <SectionCard title="Current Role">
      <p className="font-medium">{CURRENT_ROLE.title}</p>
      <p className="text-sm text-muted-foreground">{CURRENT_ROLE.org}</p>
      <dl className="mt-3 space-y-1 text-sm">
        <div><dt className="inline font-medium">Responsibilities: </dt><dd className="inline text-muted-foreground">{CURRENT_ROLE.responsibilities}</dd></div>
        <div><dt className="inline font-medium">Architecture: </dt><dd className="inline text-muted-foreground">{CURRENT_ROLE.architecture}</dd></div>
      </dl>
    </SectionCard>
  )
}

export function CurrentImpact() {
  return (
    <SectionCard title="Current Impact">
      <ul className="space-y-2 text-sm">
        {CURRENT_IMPACT.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden>•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

export function ArchitectureHighlights() {
  return (
    <SectionCard title="Architecture Highlights">
      <dl className="grid gap-3 sm:grid-cols-2">
        {ARCHITECTURE_HIGHLIGHTS.map((h) => (
          <div key={h.label}>
            <dt className="text-sm font-medium">{h.label}</dt>
            <dd className="text-sm text-muted-foreground">{h.detail}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  )
}

export function OpenTo() {
  return (
    <SectionCard title="Open To">
      <dl className="space-y-1 text-sm">
        <div><dt className="inline font-medium">Roles: </dt><dd className="inline text-muted-foreground">{OPEN_TO.roles}</dd></div>
        <div><dt className="inline font-medium">Focus: </dt><dd className="inline text-muted-foreground">{OPEN_TO.focus}</dd></div>
        <div><dt className="inline font-medium">Engagement: </dt><dd className="inline text-muted-foreground">{OPEN_TO.engagement}</dd></div>
        <div><dt className="inline font-medium">Work mode: </dt><dd className="inline text-muted-foreground">{OPEN_TO.workMode}</dd></div>
      </dl>
      <p className="mt-2 inline-flex items-center gap-2 text-sm">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--color-live)" }} aria-hidden />
        {OPEN_TO.status}
      </p>
    </SectionCard>
  )
}

export function Skills() {
  return (
    <SectionCard title="Skills">
      <div className="space-y-3">
        {SKILLS.map((g) => (
          <div key={g.group}>
            <p className="text-sm font-medium">{g.group}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export function ExperienceTimeline() {
  return (
    <SectionCard title="Experience">
      <ol className="space-y-4">
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
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
              {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

export function Insights() {
  return (
    <SectionCard title="Insights">
      {INSIGHTS.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          <p>Writing on healthcare engineering, EDI, and Supabase architecture. Coming soon.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INSIGHTS_CATEGORIES.map((c) => (
              <span key={c} className="rounded bg-muted px-2 py-0.5 text-xs">{c}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {INSIGHTS.map((a) => (
            <a key={a.href} href={a.href} className="rounded-lg border border-border p-3 text-sm">
              <span className="text-xs text-muted-foreground">{a.category}</span>
              <p className="font-medium">{a.title}</p>
            </a>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
