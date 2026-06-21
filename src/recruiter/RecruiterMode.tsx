import { useState } from "react"
import { Home, FolderGit2, Clock, Mail, Download } from "lucide-react"
import { useFormFactor } from "../hooks/useFormFactor"
import ErrorBoundary from "../components/ErrorBoundary"
import {
  Hero,
  CurrentRole,
  CurrentImpact,
  ArchitectureHighlights,
  OpenTo,
  Skills,
  ExperienceTimeline,
  Insights,
} from "./components/sections"
import ProjectFeed from "./components/ProjectFeed"
import { ContactActions } from "./components/HireMeSheet"
import { IDENTITY } from "./content"

/**
 * Recruiter Mode (Phase 6B) — the default first-paint experience.
 *
 * The résumé is intentionally NOT part of the primary IA: Recruiter Mode tells
 * the full story (Impact → Architecture → Projects → Experience → Contact)
 * without requiring the PDF. The résumé stays available only as a secondary
 * "Download Résumé" CTA (Contact section, footer, and the Hire Me panel).
 *
 * Desktop/tablet = scrollable sections; mobile = bottom-tab app
 * (Home · Projects · Experience · Contact). `onLaunchJeffOS` enters the OS.
 */
export default function RecruiterMode({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  const formFactor = useFormFactor()
  return (
    <ErrorBoundary label="Recruiter Mode">
      {formFactor === "mobile" ? (
        <RecruiterMobile onLaunchJeffOS={onLaunchJeffOS} />
      ) : (
        <RecruiterDesktop onLaunchJeffOS={onLaunchJeffOS} />
      )}
    </ErrorBoundary>
  )
}

/** Secondary résumé CTA — reused in the footer (and available in Contact/Hire Me). */
function ResumeDownloadButton({ variant = "ghost" }: { variant?: "ghost" | "solid" }) {
  const solid = variant === "solid"
  return (
    <a
      href={IDENTITY.resumeUrl}
      download
      className={
        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm " +
        (solid ? "bg-foreground text-background" : "border border-border")
      }
      style={{ minHeight: "var(--touch-target-min)" }}
    >
      <Download size={16} aria-hidden /> Download Résumé
    </a>
  )
}

/** Shared footer with the secondary résumé download + quick links. */
function RecruiterFooter() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-6 pb-[max(1rem,var(--space-safe-bottom))] text-center text-xs text-muted-foreground">
      <ResumeDownloadButton />
      <p>© {IDENTITY.name}</p>
    </footer>
  )
}

/* ----------------------------- Desktop / Tablet ---------------------------- */
function RecruiterDesktop({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* faux menu-bar nod to the OS brand */}
      <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>Jeff · File · View · Help</span>
        <span aria-hidden>🕛</span>
      </div>
      <div className="space-y-6">
        <Hero onLaunchJeffOS={onLaunchJeffOS} />
        <OpenTo />
        <CurrentRole />
        <CurrentImpact />
        <ArchitectureHighlights />
        <section className="rounded-xl border border-border p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Projects</h2>
          <ProjectFeed />
        </section>
        <Skills />
        <ExperienceTimeline />
        <Insights />
        <section className="rounded-xl border border-border p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h2>
          <ContactActions />
        </section>
      </div>
      <RecruiterFooter />
    </main>
  )
}

/* --------------------------------- Mobile --------------------------------- */
type Tab = "home" | "projects" | "experience" | "contact"

function RecruiterMobile({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  const [tab, setTab] = useState<Tab>("home")
  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "experience", label: "Experience", icon: Clock },
    { id: "contact", label: "Contact", icon: Mail },
  ]

  return (
    <div className="flex h-[100dvh] flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-[max(1.5rem,var(--space-safe-top))] pb-24">
        {tab === "home" && (
          <div className="space-y-5">
            <Hero onLaunchJeffOS={onLaunchJeffOS} />
            <OpenTo />
            <CurrentRole />
            <CurrentImpact />
            <ArchitectureHighlights />
            <Skills />
            <RecruiterFooter />
          </div>
        )}
        {tab === "projects" && <ProjectFeed />}
        {tab === "experience" && <ExperienceTimeline />}
        {tab === "contact" && (
          <div className="space-y-5">
            <ContactActions />
            <RecruiterFooter />
          </div>
        )}
      </div>

      {/* Fixed bottom TabBar — Tier-0 always reachable (no Résumé tab; the PDF
          is a secondary download in Contact / footer / Hire Me). */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-border bg-background/95 pb-[var(--space-safe-bottom)] backdrop-blur"
      >
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px]"
              style={{ minHeight: "var(--touch-target-min)", color: active ? "var(--color-hire)" : "var(--muted-foreground)" }}
            >
              <Icon size={20} aria-hidden />
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
