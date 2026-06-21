import { useState } from "react"
import { Home, FolderGit2, Clock, FileText, Mail } from "lucide-react"
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
import ResumeViewer from "./components/ResumeViewer"
import ProjectFeed from "./components/ProjectFeed"
import { ContactActions } from "./components/HireMeSheet"

/**
 * Recruiter Mode (Phase 6A) — the default first-paint experience.
 * Desktop/tablet = scrollable sections; mobile = bottom-tab app
 * (Home · Projects · Experience · Résumé · Contact), no OS chrome.
 * `onLaunchJeffOS` enters the immersive desktop OS (opt-in).
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
        <section className="rounded-xl border border-border p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Résumé</h2>
          <div className="h-[70vh]">
            <ResumeViewer />
          </div>
        </section>
        <Insights />
        <section className="rounded-xl border border-border p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h2>
          <ContactActions />
        </section>
      </div>
    </main>
  )
}

/* --------------------------------- Mobile --------------------------------- */
type Tab = "home" | "projects" | "experience" | "resume" | "contact"

function RecruiterMobile({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  const [tab, setTab] = useState<Tab>("home")
  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "experience", label: "Experience", icon: Clock },
    { id: "resume", label: "Résumé", icon: FileText },
    { id: "contact", label: "Contact", icon: Mail },
  ]

  return (
    <div className="flex h-[100dvh] flex-col">
      <div
        className="flex-1 overflow-y-auto px-5 pt-[max(1.5rem,var(--space-safe-top))] pb-24"
      >
        {tab === "home" && (
          <div className="space-y-5">
            <Hero onLaunchJeffOS={onLaunchJeffOS} />
            <OpenTo />
            <CurrentRole />
            <CurrentImpact />
            <ArchitectureHighlights />
            <Skills />
          </div>
        )}
        {tab === "projects" && <ProjectFeed />}
        {tab === "experience" && <ExperienceTimeline />}
        {tab === "resume" && (
          <div className="h-[calc(100dvh-9rem)]">
            <ResumeViewer />
          </div>
        )}
        {tab === "contact" && <ContactActions />}
      </div>

      {/* Fixed bottom TabBar — Tier-0 always reachable */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background/95 pb-[var(--space-safe-bottom)] backdrop-blur"
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
