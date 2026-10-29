import * as Tabs from "@radix-ui/react-tabs"
import { ArrowUpRight } from "lucide-react"
import { FEATURED_WORK } from "../content"
import { Chip, MacPanel } from "./primitives"

const STEPS = [
  { key: "problem", label: "Problem", tone: "border-foreground/15" },
  { key: "architecture", label: "Approach", tone: "border-foreground/40" },
  { key: "outcome", label: "Outcome", tone: "border-[var(--color-hire)]" },
] as const

/**
 * Proof of work as a Finder-style explorer: an index of shipped work (left)
 * and the selected project's case file (right). Built on Radix Tabs, so it is
 * a real tablist — ↑/↓ move between projects, Tab enters the detail.
 *
 * Nothing is withheld behind the interaction: every project's name, domain
 * and summary is visible in the index, the flagship is selected by default,
 * and each case file links to its full prerendered case study.
 */
export function ProjectExplorer({
  value,
  onValueChange,
  newTab,
}: {
  value: string
  onValueChange: (slug: string) => void
  /** Inside JeffOS, open case studies in a new tab rather than leaving the OS. */
  newTab: boolean
}) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={onValueChange}
      orientation="vertical"
      className="grid gap-6 @3xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] @3xl:gap-8"
    >
      <Tabs.List aria-label="Projects" className="flex flex-col gap-1">
        {FEATURED_WORK.map((w, i) => (
          <Tabs.Trigger
            key={w.slug}
            value={w.slug}
            className="rx-selectable group flex min-h-11 items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)] focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=active]:hover:bg-transparent"
          >
            <span className="rx-mono pt-0.5 text-[11px] text-muted-foreground group-data-[state=active]:text-white/80">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-semibold leading-5">{w.name}</span>
                {w.flagship && (
                  <span className="rx-mono rounded-[4px] border border-current px-1 text-[10px] uppercase leading-4 tracking-wider text-[var(--rx-accent-text)] group-data-[state=active]:text-white">
                    Flagship
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[12px] leading-4 text-muted-foreground group-data-[state=active]:text-white/80">
                {w.domain}
              </span>
            </span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {FEATURED_WORK.map((w) => (
        <Tabs.Content
          key={w.slug}
          value={w.slug}
          className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)] focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[10px]"
        >
          <MacPanel title={`${w.name} — Case File`} bodyClassName="p-6 @3xl:p-8">
            <p className="rx-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{w.domain}</p>
            <h3 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] @3xl:text-[28px]">{w.name}</h3>
            <p className="mt-2 max-w-[56ch] text-[15px] leading-6 text-muted-foreground">{w.summary}</p>

            {/* Problem → Approach → Outcome: one connected path whose border
                darkens toward the outcome (Uniform Connectedness, Continuity). */}
            <ol className="mt-7 grid gap-5 @2xl:grid-cols-3 @2xl:gap-6">
              {STEPS.map((s, i) => (
                <li key={s.key} className={`border-t-2 pt-3 ${s.tone}`}>
                  <p className="rx-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")} · {s.label}
                  </p>
                  <p className={`mt-2 text-[14px] leading-[1.55] ${s.key === "outcome" ? "font-medium text-foreground" : "text-foreground/85"}`}>
                    {w[s.key]}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-5">
              <ul className="flex flex-1 flex-wrap gap-1.5" aria-label="Technologies">
                {w.tech.map((t) => (
                  <li key={t}>
                    <Chip>{t}</Chip>
                  </li>
                ))}
              </ul>
              <a
                href={`/projects/${w.slug}/`}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-[14px] font-medium text-[var(--rx-accent-text)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)]"
              >
                Read the case study <ArrowUpRight size={15} aria-hidden />
                {newTab && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            </div>
          </MacPanel>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
