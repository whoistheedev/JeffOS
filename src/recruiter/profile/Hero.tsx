import { ArrowDown, Mail, ScanEye } from "lucide-react"
import { ABOUT_ROWS, IDENTITY, PRIMARY_CTA } from "../content"
import { cn } from "../../lib/utils"
import { LiveDot, MacPanel, Monogram } from "./primitives"
import { buttonClass } from "./ui"

/**
 * Hero — "Meet the engineer". Asymmetric: an editorial name + statement on the
 * left, and an "About This Engineer" window on the right (Tiger's About This
 * Mac, re-cast as a spec card). Who / what / how-to-contact are all answered
 * in the first viewport; the primary CTA is the only filled button
 * (Von Restorff). Only the About panel animates in (transform/opacity,
 * motion-safe) — the name, statement and CTAs paint immediately.
 */
export function Hero({
  onExploreWork,
  onMoreInfo,
  onQuickLook,
  hintId,
}: {
  onExploreWork: () => void
  onMoreInfo: () => void
  onQuickLook: () => void
  hintId: string
}) {
  return (
    <section aria-label="Introduction" className="grid gap-10 @4xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] @4xl:items-center @4xl:gap-14">
      <div>
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LiveDot />
          <span>
            Shipping at <span className="font-medium text-foreground">{IDENTITY.org}</span> since {IDENTITY.since}
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

        <p className="mt-5 max-w-[58ch] text-[15px] leading-6 text-muted-foreground">
          {IDENTITY.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href={PRIMARY_CTA.href} aria-describedby={hintId} className={buttonClass("primary")}>
            <Mail size={17} aria-hidden /> {PRIMARY_CTA.label}
          </a>
          <button type="button" onClick={onExploreWork} className={buttonClass("secondary")}>
            Explore My Work <ArrowDown size={16} aria-hidden />
          </button>
        </div>
        <p id={hintId} className="sr-only">{PRIMARY_CTA.hint}</p>

        {/* The recruiter shortcut — essentials in one panel, never gated. */}
        <p className="mt-5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
          Need the essentials?
          <button type="button" onClick={onQuickLook} className={cn(buttonClass("tertiary", "sm"), "-ml-1 font-medium text-foreground")}>
            <ScanEye size={15} aria-hidden /> Open Quick Look
          </button>
        </p>
      </div>

      <MacPanel
        as="aside"
        title="About This Engineer"
        className="rx-rise mx-auto w-full max-w-[25rem] [animation-delay:160ms] @4xl:mx-0 @4xl:justify-self-end"
        bodyClassName="px-6 pb-6 pt-7 text-center"
      >
        <Monogram initials={IDENTITY.initials} size={68} />
        <p className="mt-4 text-[19px] font-semibold tracking-[-0.01em]">{IDENTITY.name}</p>
        <p className="text-[13px] text-muted-foreground">{IDENTITY.title}</p>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-left text-[13px] leading-5">
          {ABOUT_ROWS.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-right font-medium text-muted-foreground">{r.label}</dt>
              <dd className="min-w-0">{r.value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={onMoreInfo} className={cn(buttonClass("secondary", "sm"), "mt-6")}>
          More Info…
        </button>
      </MacPanel>
    </section>
  )
}
