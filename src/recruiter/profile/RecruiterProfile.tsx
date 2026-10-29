import { useId, useRef, useState } from "react"
import { Mail, Moon, ScanEye, Sun } from "lucide-react"
import { FEATURED_WORK, IDENTITY, PRIMARY_CTA } from "../content"
import { LaunchJeffOSButton } from "../components/LaunchJeffOSButton"
import { Hero } from "./Hero"
import { ProjectExplorer } from "./ProjectExplorer"
import { QuickLook } from "./QuickLook"
import { Capabilities, CareerLog, ConnectionPanel, JeffOSCallout, SystemInformation } from "./Sections"
import { cn } from "../../lib/utils"
import { buttonClass, Monogram, SectionHeader, scrollToId } from "./primitives"

type PageProps = {
  variant: "page"
  onLaunchJeffOS: () => void
  isDark: boolean
  toggleTheme: () => void
}
type WindowProps = { variant: "window" }

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
 * Order follows the Serial Position Effect: identity + contact first, proof of
 * work second, depth in the middle, contact again at the end.
 */
export function RecruiterProfile(props: PageProps | WindowProps) {
  const isPage = props.variant === "page"
  // Only the front door owns the page's <main>; inside JeffOS it's one window of many.
  const Body = isPage ? "main" : "div"
  const uid = useId()
  // Front door keeps stable, shareable anchors; windows are prefixed so two
  // open Hire Me windows never share an id.
  const idFor = (name: string) => (isPage ? name : `${uid}-${name}`)

  const flagship = FEATURED_WORK.find((w) => w.flagship) ?? FEATURED_WORK[0]
  const [project, setProject] = useState(flagship.slug)
  const [quickLook, setQuickLook] = useState(false)
  const quickLookOpener = useRef<HTMLElement | null>(null)
  const openQuickLook = () => {
    quickLookOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setQuickLook(true)
  }

  const showProject = (slug: string) => {
    setProject(slug)
    // Focus goes to the Work section, not back to the Quick Look opener.
    quickLookOpener.current = null
    setQuickLook(false)
    // Let Quick Look's close (and focus restore) finish before moving focus.
    requestAnimationFrame(() => scrollToId(idFor("work")))
  }

  return (
    <div className="rx @container min-h-full bg-background text-foreground">
      {isPage ? (
        <PageActionStrip {...(props as PageProps)} onQuickLook={openQuickLook} />
      ) : (
        <WindowToolbar onQuickLook={openQuickLook} />
      )}

      <Body className={`mx-auto max-w-[72rem] px-5 @2xl:px-8 @5xl:px-12 ${isPage ? "pb-32 pt-10 @2xl:pt-16 sm:pb-24" : "pb-16 pt-8"}`}>
        <Hero
          hintId={idFor("cta-hint")}
          onExploreWork={() => scrollToId(idFor("work"))}
          onMoreInfo={() => scrollToId(idFor("system"))}
          onQuickLook={openQuickLook}
        />

        <section id={idFor("work")} aria-labelledby={idFor("work-h")} className="mt-24 scroll-mt-20 @3xl:mt-32">
          <SectionHeader
            id={idFor("work-h")}
            index="01"
            kicker="Proof of work"
            title="Shipped, not just built."
            lead="Production systems in healthcare operations — and the operating system this portfolio runs on. Each one links to its full case study."
          />
          <ProjectExplorer value={project} onValueChange={setProject} newTab={!isPage} />
        </section>

        <section id={idFor("own")} aria-labelledby={idFor("own-h")} className="mt-24 scroll-mt-20 @3xl:mt-32">
          <SectionHeader
            id={idFor("own-h")}
            index="02"
            kicker="Capabilities"
            title="What I can own."
            lead="Outcomes I take responsibility for end to end — each backed by shipped work."
          />
          <Capabilities onEvidence={showProject} />
        </section>

        <section id={idFor("system")} aria-labelledby={idFor("system-h")} className="mt-24 scroll-mt-20 @3xl:mt-32">
          <SectionHeader
            id={idFor("system-h")}
            index="03"
            kicker="System information"
            title="The engineer, profiled."
            lead="A plain-English summary for every area. Open Specs for the technical detail."
          />
          <SystemInformation name={IDENTITY.name} />
        </section>

        <section id={idFor("career")} aria-labelledby={idFor("career-h")} className="mt-24 scroll-mt-20 @3xl:mt-32">
          <SectionHeader id={idFor("career-h")} index="04" kicker="Career log" title="Where the work happened." />
          <CareerLog />
        </section>

        {isPage && (
          <div className="mt-24 @3xl:mt-32">
            <JeffOSCallout onLaunchJeffOS={(props as PageProps).onLaunchJeffOS} />
          </div>
        )}

        <div id={idFor("contact")} className="mt-24 scroll-mt-20 @3xl:mt-32">
          <ConnectionPanel name={IDENTITY.name.split(" ")[0]} initials={IDENTITY.initials} headingId={idFor("contact-h")} />
        </div>

        <footer className="rx-mono mt-16 flex flex-wrap justify-between gap-2 border-t border-border pt-6 text-[11px] text-muted-foreground">
          <span>© {IDENTITY.name}</span>
          <span>Built by hand — React, TypeScript, Supabase.</span>
        </footer>
      </Body>

      {isPage && <MobileThumbBar onQuickLook={openQuickLook} />}

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
}: PageProps & { onQuickLook: () => void }) {
  return (
    <div className="sticky top-0 z-40 border-b border-border/80 bg-background/85 pt-[var(--space-safe-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[72rem] items-center gap-3 px-5 @2xl:px-8 @5xl:px-12">
        <Monogram initials={IDENTITY.initials} size={30} />
        <p className="hidden min-w-0 truncate text-[14px] font-semibold @lg:block">{IDENTITY.name}</p>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onQuickLook} className={cn(buttonClass("secondary", "sm"), "hidden @lg:inline-flex")}>
            <ScanEye size={15} aria-hidden /> Quick Look
          </button>
          <div className="hidden @3xl:block">
            <LaunchJeffOSButton onClick={onLaunchJeffOS} variant="compact" />
          </div>
          <a href={PRIMARY_CTA.href} className={cn(buttonClass("primary", "sm"), "hidden sm:inline-flex")}>
            <Mail size={15} aria-hidden /> {PRIMARY_CTA.label}
          </a>
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
    </div>
  )
}

/** Phone-width front door: the two key actions in the thumb zone (Fitts's Law). */
function MobileThumbBar({ onQuickLook }: { onQuickLook: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 px-4 pb-[max(0.75rem,var(--space-safe-bottom))] pt-3 backdrop-blur-md sm:hidden">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button type="button" onClick={onQuickLook} className={buttonClass("secondary", "sm")}>
          <ScanEye size={15} aria-hidden /> Quick Look
        </button>
        <a href={PRIMARY_CTA.href} className={buttonClass("primary", "sm")}>
          <Mail size={15} aria-hidden /> {PRIMARY_CTA.label}
        </a>
      </div>
    </div>
  )
}

/** Inside the Hire Me window: a slim Tiger-style toolbar pinned to the top. */
function WindowToolbar({ onQuickLook }: { onQuickLook: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-foreground/10 bg-[linear-gradient(to_bottom,#f3f3f3,#e2e2e2)] px-3 py-1.5">
      <button type="button" onClick={onQuickLook} className={cn(buttonClass("secondary", "sm"), "bg-white/70")}>
        <ScanEye size={15} aria-hidden /> Quick Look
      </button>
      <a href={PRIMARY_CTA.href} className={cn(buttonClass("primary", "sm"), "ml-auto")}>
        <Mail size={15} aria-hidden /> {PRIMARY_CTA.label}
      </a>
    </div>
  )
}
