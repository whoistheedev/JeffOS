import { ArrowDown, ArrowUpRight } from "lucide-react"
import { FEATURED_WORK } from "../content"
import { cn } from "../../lib/utils"
import { Chip, MacPanel } from "./primitives"

const label = "rx-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"

/**
 * Selected work — every project on the page, none behind a tab. Each case
 * leads with its outcome (the line a recruiter repeats), then problem and
 * approach, with a small diagram of how the system flows so the section is
 * not text alone. Each case links to its full prerendered case study.
 *
 * `highlight` marks the case a skill's "Evidence" link just jumped to.
 */
export function WorkList({
  idFor,
  highlight,
  newTab,
}: {
  idFor: (name: string) => string
  highlight: string | null
  /** Inside JeffOS, open case studies in a new tab rather than leaving the OS. */
  newTab: boolean
}) {
  return (
    <ol className="border-b border-border">
      {FEATURED_WORK.map((w, i) => (
        <li
          key={w.slug}
          id={idFor(`work-${w.slug}`)}
          className={cn(
            "relative grid scroll-mt-20 gap-x-10 gap-y-6 border-t border-border py-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] @3xl:py-10",
            highlight === w.slug &&
              "before:absolute before:-left-3 before:bottom-8 before:top-8 before:w-0.5 before:rounded-full before:bg-[var(--color-hire)] @2xl:before:-left-4"
          )}
        >
          <div className="min-w-0">
            <p className={cn(label, "flex flex-wrap items-center gap-x-3 gap-y-1")}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <span>{w.domain}</span>
              {w.flagship && (
                <span className="rounded-[4px] border border-current px-1 text-[10px] leading-4 tracking-wider text-[var(--rx-accent-text)]">
                  Flagship
                </span>
              )}
            </p>
            <h3 tabIndex={-1} className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] focus:outline-none @3xl:text-[28px]">
              {w.name}
            </h3>

            <p className={cn(label, "mt-5 text-[var(--rx-accent-text)]")}>Outcome</p>
            <p className="mt-1.5 max-w-[52ch] text-[18px] font-medium leading-[1.4] tracking-[-0.01em] @3xl:text-[20px]">
              {w.outcome}
            </p>

            <dl className="mt-6 grid gap-5 @2xl:grid-cols-2 @2xl:gap-6">
              <div className="border-t border-foreground/15 pt-3">
                <dt className={label}>Problem</dt>
                <dd className="mt-2 text-[14px] leading-[1.55] text-foreground/85">{w.problem}</dd>
              </div>
              <div className="border-t border-foreground/15 pt-3">
                <dt className={label}>Approach</dt>
                <dd className="mt-2 text-[14px] leading-[1.55] text-foreground/85">{w.architecture}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
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
                <span className="sr-only">
                  : {w.name}
                  {newTab && " (opens in a new tab)"}
                </span>
              </a>
            </div>
          </div>

          <MacPanel title={w.flowTitle} className="self-start" bodyClassName="p-4">
            <ol aria-label={`${w.name}: ${w.flowTitle.toLowerCase()}`} className="flex flex-col">
              {w.flow.map((step, n) => (
                <li key={step} className="flex flex-col items-center">
                  {n > 0 && <ArrowDown size={14} aria-hidden className="my-1.5 text-muted-foreground" />}
                  <span
                    className={cn(
                      "rx-mono w-full rounded-md border px-3 py-2 text-center text-[12px] leading-4",
                      n === w.flow.length - 1
                        ? "border-[var(--color-hire)] text-foreground"
                        : "border-foreground/15 text-foreground/85"
                    )}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </MacPanel>
        </li>
      ))}
    </ol>
  )
}
