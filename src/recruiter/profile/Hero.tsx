import type { RefObject } from "react"
import { ArrowDown, FileText, Linkedin, Mail } from "lucide-react"
import { AVAILABLE_FOR, CONTACT, EDUCATION, EXPERIENCE, IDENTITY, PRIMARY_CTA, RESUME_REQUEST_HREF } from "../content"
import { LiveDot, MacPanel } from "./primitives"
import { buttonClass } from "./ui"

const label = "rx-mono mb-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground"

/**
 * Hero — a profile header. Left: who, what he builds, and the one filled CTA
 * (Von Restorff). Right: a Tiger "Get Info" window holding what a recruiter
 * scans for first — roles and dates, education, what he is open to, and the
 * résumé route (Jakob's Law: the same facts every recruiting tool leads with).
 * Nothing in the panel repeats the left column.
 *
 * Only the panel animates in (transform/opacity, motion-safe) — the name,
 * statement and CTAs paint immediately.
 */
export function Hero({
  onExploreWork,
  hintId,
  ctaRef,
}: {
  onExploreWork: () => void
  hintId: string
  /** Observed by the page chrome, which shows its own CTA only once this one scrolls away. */
  ctaRef: RefObject<HTMLAnchorElement | null>
}) {
  return (
    <section aria-label="Introduction" className="grid gap-10 @4xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @4xl:items-center @4xl:gap-14">
      <div>
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LiveDot />
          <span>
            {IDENTITY.title} at <span className="font-medium text-foreground">{IDENTITY.org}</span>
          </span>
        </p>

        <h1 className="mt-5">
          <span className="block text-[44px] font-semibold leading-[0.95] tracking-[-0.035em] text-balance @2xl:text-[60px] @5xl:text-[72px]">
            {IDENTITY.name}
          </span>
          <span className="sr-only"> — </span>
          <span className="mt-5 block max-w-[28ch] text-[22px] font-medium leading-[1.2] tracking-[-0.015em] text-balance text-foreground/85 @2xl:text-[26px]">
            {IDENTITY.headline}
          </span>
        </h1>

        <p className="mt-5 max-w-[58ch] text-[15px] leading-6 text-muted-foreground">{IDENTITY.subtitle}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a ref={ctaRef} href={PRIMARY_CTA.href} aria-describedby={hintId} className={buttonClass("primary")}>
            <Mail size={17} aria-hidden /> {PRIMARY_CTA.label}
          </a>
          <button type="button" onClick={onExploreWork} className={buttonClass("secondary")}>
            See the Work <ArrowDown size={16} aria-hidden />
          </button>
        </div>
        <p id={hintId} className="sr-only">{PRIMARY_CTA.hint}</p>
      </div>

      <MacPanel
        as="aside"
        title="Get Info"
        label="Career at a glance"
        className="rx-rise mx-auto w-full max-w-[27rem] [animation-delay:160ms] @4xl:mx-0 @4xl:justify-self-end"
        bodyClassName="text-[13px] leading-5"
      >
        <div className="px-5 pb-4 pt-5">
          <p className={label}>Experience</p>
          <ol aria-label="Experience" className="space-y-2.5">
            {EXPERIENCE.map((e) => (
              <li key={e.period} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
                <span className="min-w-0">
                  <span className="block font-medium">{e.role}</span>
                  <span className="block text-muted-foreground">{e.org}</span>
                </span>
                <span className="rx-mono flex h-5 items-center gap-1.5 text-[11px] text-muted-foreground">
                  {e.current && <LiveDot />}
                  {e.period}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-border px-5 py-4">
          <p className={label}>Education</p>
          <ul aria-label="Education" className="space-y-1">
            {EDUCATION.map((ed) => (
              <li key={ed.credential} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
                <span className="min-w-0">
                  <span className="font-medium">{ed.credential}</span>
                  <span className="text-muted-foreground"> · {ed.org}</span>
                </span>
                <span className="rx-mono text-[11px] text-muted-foreground">{ed.period}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border px-5 py-4">
          <p className={label}>Open to</p>
          <p>{AVAILABLE_FOR.join(" · ")}</p>
        </div>

        <ul className="flex flex-wrap gap-x-5 border-t border-border bg-muted/50 px-5 py-1" aria-label="Résumé and profile">
          <li>
            <a href={RESUME_REQUEST_HREF} className={buttonClass("tertiary", "sm")}>
              <FileText size={15} aria-hidden /> Request résumé
            </a>
          </li>
          <li>
            <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" className={buttonClass("tertiary", "sm")}>
              <Linkedin size={15} aria-hidden /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </MacPanel>
    </section>
  )
}
