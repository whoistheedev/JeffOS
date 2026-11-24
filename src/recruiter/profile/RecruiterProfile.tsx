import { useEffect, useId, useRef, useState } from "react"
import { Mail, Moon, ScanEye, Sun } from "lucide-react"
import { IDENTITY, PRIMARY_CTA } from "../content"
import { LaunchJeffOSButton } from "../components/LaunchJeffOSButton"
import { Hero } from "./Hero"
import { QuickLook } from "./QuickLook"
import { CareerLog, ConnectionPanel, JeffOSCallout, ProofStrip, Skills } from "./Sections"
import { WorkList } from "./WorkList"
import { cn } from "../../lib/utils"
import { Monogram, SectionHeader } from "./primitives"
import { buttonClass, scrollToId } from "./ui"

type PageProps = {
  variant: "page"
  onLaunchJeffOS: () => void
  isDark: boolean
  toggleTheme: () => void
}
type WindowProps = { variant: "window" }

/** Chrome CTAs fade in only once the hero's own CTA is gone — one filled button on screen at a time. */
const chromeCta = (show: boolean) =>
  cn("transition-opacity duration-200 motion-reduce:transition-none", show ? "opacity-100" : "pointer-events-none invisible opacity-0")

/**
 * The recruiter experience — one component tree for both homes:
 *   - variant "page":   the Recruiter Mode front door (full document scroll,
 *                       sticky action strip, mobile thumb bar, JeffOS callout).
 *   - variant "window": the JeffOS "Hire Me" window (scrolls inside the
 *                       window; no Launch JeffOS, case studies open in a tab).
 *
 * Layout responds to its CONTAINER (Tailwind @container), not the viewport, so
 * the same sections reflow correctly in a 600px window on a 1440px screen.
 *
 * Order follows what a recruiter scans for (Jakob's Law, Serial Position):
 * identity + career facts + contact first, proof second, experience third,
 * skills as supporting depth, contact again at the end (Peak-End).
 */
export function RecruiterProfile(props: PageProps | WindowProps) {
  const isPage = props.variant === "page"
  // Only the front door owns the page's <main>; inside JeffOS it's one window of many.
  const Body = isPage ? "main" : "div"
  const uid = useId()
  // Front door keeps stable, shareable anchors; windows are prefixed so two
  // open Hire Me windows never share an id.
  const idFor = (name: string) => (isPage ? name : `${uid}-${name}`)

  const [highlight, setHighlight] = useState<string | null>(null)
  const [quickLook, setQuickLook] = useState(false)
  const quickLookOpener = useRef<HTMLElement | null>(null)
  const openQuickLook = () => {
    quickLookOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setQuickLook(true)
  }

  // Without IntersectionObserver (old browsers, tests) the chrome CTA is simply always shown.
  const heroCta = useRef<HTMLAnchorElement | null>(null)
  const [pastHero, setPastHero] = useState(() => typeof IntersectionObserver === "undefined")
  useEffect(() => {
    const el = heroCta.current
    if (!el || typeof IntersectionObserver === "undefined") return
    // The sticky strip is 56px tall; a CTA underneath it counts as gone.
    const io = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { rootMargin: "-56px 0px 0px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const showProject = (slug: string) => {
    setHighlight(slug)
    // Focus goes to the case, not back to the Quick Look opener.
    quickLookOpener.current = null
    setQuickLook(false)
    // Let Quick Look's close (and focus restore) finish before moving focus.
    requestAnimationFrame(() => scrollToId(idFor(`work-${slug}`)))
  }

  const section = "mt-20 scroll-mt-20 @3xl:mt-24"

  return (
    <div className="rx @container min-h-full bg-background text-foreground">
      {isPage ? (
        <PageActionStrip {...(props as PageProps)} onQuickLook={openQuickLook} showCta={pastHero} />
      ) : (
        <WindowToolbar onQuickLook={openQuickLook} showCta={pastHero} />
      )}

      <Body className={`mx-auto max-w-[72rem] px-5 @2xl:px-8 @5xl:px-12 ${isPage ? "pb-32 pt-10 @2xl:pt-16 sm:pb-24" : "pb-16 pt-8"}`}>
        <Hero hintId={idFor("cta-hint")} ctaRef={heroCta} onExploreWork={() => scrollToId(idFor("work"))} />

        <div className="mt-14 @3xl:mt-16">
          <ProofStrip />
        </div>

        <section id={idFor("work")} aria-labelledby={idFor("work-h")} className={section}>
          <SectionHeader
            id={idFor("work-h")}
            index="01"
            title="Selected work"
            lead="Three production healthcare systems, and the operating system this portfolio runs in. Outcome first; each links to its full case study."
          />
          <WorkList idFor={idFor} highlight={highlight} newTab={!isPage} />
        </section>

        <section id={idFor("career")} aria-labelledby={idFor("career-h")} className={section}>
          <SectionHeader id={idFor("career-h")} index="02" title="Experience" />
          <CareerLog />
        </section>

        <section id={idFor("skills")} aria-labelledby={idFor("skills-h")} className={section}>
          <SectionHeader
            id={idFor("skills-h")}
            index="03"
            title="Skills"
            lead="In plain English first. Open the technical detail for the stack, or follow the evidence to the work that backs it."
          />
          <Skills onEvidence={showProject} />
        </section>

        {isPage && (
          <div className={section}>
            <JeffOSCallout onLaunchJeffOS={(props as PageProps).onLaunchJeffOS} />
          </div>
        )}

        <div id={idFor("contact")} className={section}>
          <ConnectionPanel name={IDENTITY.name.split(" ")[0]} initials={IDENTITY.initials} headingId={idFor("contact-h")} />
        </div>

        <footer className="rx-mono mt-16 flex flex-wrap justify-between gap-2 border-t border-border pt-6 text-[11px] text-muted-foreground">
          <span>© {IDENTITY.name}</span>
          <span>Built by hand — React, TypeScript, Supabase.</span>
        </footer>
      </Body>

      {isPage && <MobileThumbBar onQuickLook={openQuickLook} show={pastHero} />}

      <QuickLook open={quickLook} onOpenChange={setQuickLook} onSelectProject={showProject} returnFocusTo={quickLookOpener} />
    </div>
  )
}

/* ------------------------------ page chrome ------------------------------- */
/**
 * Sticky action strip — identity + actions only, no navigation links (the
 * brief rules out a website nav bar). Keeps the primary CTA one click away at
 * every scroll depth.
 */
function PageActionStrip({
  onLaunchJeffOS,
  isDark,
  toggleTheme,
  onQuickLook,
  showCta,
}: PageProps & { onQuickLook: () => void; showCta: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 pt-[var(--space-safe-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[72rem] items-center gap-3 px-5 @2xl:px-8 @5xl:px-12">
        <Monogram initials={IDENTITY.initials} size={30} />
        <p className="hidden min-w-0 truncate text-[14px] font-semibold @lg:block">{IDENTITY.name}</p>
        <div className="ml-auto flex items-center gap-2">
          {/* First in the group, so the others don't shift when it fades in. */}
          <a href={PRIMARY_CTA.href} className={cn(buttonClass("primary", "sm"), "hidden sm:inline-flex", chromeCta(showCta))}>
            <Mail size={15} aria-hidden /> {PRIMARY_CTA.label}
          </a>
          <button type="button" onClick={onQuickLook} className={cn(buttonClass("secondary", "sm"), "hidden @lg:inline-flex")}>
            <ScanEye size={15} aria-hidden /> Quick Look
          </button>
          <div className="hidden @3xl:block">
            <LaunchJeffOSButton onClick={onLaunchJeffOS} variant="compact" />
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)]"
          >
            {isDark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
          </button>
        </div>
      </div>
    </header>
  )
}

/**
 * Phone-width front door: the two key actions in the thumb zone (Fitts's Law).
 * Slides in once the hero's own CTA has scrolled away.
 */
function MobileThumbBar({ onQuickLook, show }: { onQuickLook: () => void; show: boolean }) {
  return (
    <aside
      aria-label="Quick actions"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 px-4 pb-[max(0.75rem,var(--space-safe-bottom))] pt-3 backdrop-blur-md transition-[transform,visibility] duration-200 motion-reduce:transition-none sm:hidden",
        show ? "translate-y-0" : "invisible translate-y-full"
      )}
    >
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button type="button" onClick={onQuickLook} className={buttonClass("secondary", "sm")}>
          <ScanEye size={15} aria-hidden /> Quick Look
        </button>
        <a href={PRIMARY_CTA.href} className={buttonClass("primary", "sm")}>
          <Mail size={15} aria-hidden /> {PRIMARY_CTA.label}
        </a>
      </div>
    </aside>
  )
}

/** Inside the Hire Me window: a slim Tiger-style toolbar pinned to the top. */
function WindowToolbar({ onQuickLook, showCta }: { onQuickLook: () => void; showCta: boolean }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-foreground/10 bg-[linear-gradient(to_bottom,#f3f3f3,#e2e2e2)] px-3 py-1.5">
      <button type="button" onClick={onQuickLook} className={cn(buttonClass("secondary", "sm"), "bg-white/70")}>
        <ScanEye size={15} aria-hidden /> Quick Look
      </button>
      <a href={PRIMARY_CTA.href} className={cn(buttonClass("primary", "sm"), "ml-auto", chromeCta(showCta))}>
        <Mail size={15} aria-hidden /> {PRIMARY_CTA.label}
      </a>
    </div>
  )
}
