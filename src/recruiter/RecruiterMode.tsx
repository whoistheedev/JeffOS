import { useEffect, useState } from "react"
import { Home, FolderGit2, Clock, Mail, Calendar } from "lucide-react"
import { useFormFactor } from "../hooks/useFormFactor"
import ErrorBoundary from "../components/ErrorBoundary"
import {
  Hero,
  CurrentImpact,
  ArchitectureHighlights,
  FeaturedWork,
  ExperienceTimeline,
  AvailableFor,
  JeffOSCallout,
  ResumeDownloadButton,
} from "./components/sections"
import { ContactActions } from "./components/HireMeSheet"
import { IDENTITY, CONTACT } from "./content"

/**
 * Recruiter Mode — premium executive engineering profile.
 *
 * Positions Jeffrey as a systems engineer building business-critical healthcare
 * infrastructure (EDI / RCM / multi-tenant / Supabase). The résumé is a
 * secondary download only — the story stands on its own.
 *
 * Desktop/tablet = scrollable reading spine; mobile = bottom-tab app
 * (Home · Projects · Experience · Contact). `onLaunchJeffOS` enters the OS.
 */
export default function RecruiterMode({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  const formFactor = useFormFactor()

  // Dark mode for Recruiter Mode follows the OS preference. Scoped to while
  // Recruiter Mode is mounted, so it never fights the JeffOS holiday-theme
  // wallpaper system. (The .dark token set already exists in index.css.)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => document.documentElement.classList.toggle("dark", mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => {
      mq.removeEventListener("change", apply)
      document.documentElement.classList.remove("dark")
    }
  }, [])

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

const scheduleHref = () =>
  CONTACT.schedulerUrl ?? `mailto:${CONTACT.email}?subject=Let's%20talk`

/* ------------------------------- ExecutiveHeader -------------------------- */
function ExecutiveHeader() {
  return (
    <div className="sticky top-0 z-40 -mx-6 mb-6 flex items-center justify-between border-b border-border bg-background/80 px-6 py-2 backdrop-blur">
      <span className="text-xs text-muted-foreground">Jeff · File · View · Help</span>
      <a
        href={scheduleHref()}
        target={CONTACT.schedulerUrl ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
        style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)" }}
      >
        <Calendar size={13} aria-hidden /> Schedule
      </a>
    </div>
  )
}

function RecruiterFooter() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-6 pb-[max(1rem,var(--space-safe-bottom))] text-center text-xs text-muted-foreground">
      <ResumeDownloadButton />
      <p>© {IDENTITY.name}</p>
    </footer>
  )
}

/* ----------------------------- Premium Contact ---------------------------- */
function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contact</h2>
      <p className="mb-5 max-w-prose text-[15px] leading-relaxed">
        Let's talk about systems worth building.
      </p>
      <ContactActions />
    </section>
  )
}

/* ----------------------------- Desktop / Tablet --------------------------- */
function RecruiterDesktop({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 pb-10">
        <ExecutiveHeader />
        <div className="space-y-14">
          <Hero onLaunchJeffOS={onLaunchJeffOS} />
          <CurrentImpact />
          <ArchitectureHighlights />
          <FeaturedWork />
          <ExperienceTimeline />
          <AvailableFor />
          <JeffOSCallout onLaunchJeffOS={onLaunchJeffOS} />
          <ContactSection />
        </div>
        <RecruiterFooter />
      </div>
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
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <div className="flex-1 overflow-y-auto px-5 pt-[max(1.25rem,var(--space-safe-top))] pb-24">
        {tab === "home" && (
          <div className="space-y-12">
            <Hero onLaunchJeffOS={onLaunchJeffOS} />
            <CurrentImpact />
            <ArchitectureHighlights />
            <AvailableFor />
            <JeffOSCallout onLaunchJeffOS={onLaunchJeffOS} />
            <RecruiterFooter />
          </div>
        )}
        {tab === "projects" && <FeaturedWork />}
        {tab === "experience" && <ExperienceTimeline />}
        {tab === "contact" && (
          <div className="space-y-10">
            <ContactSection />
            <RecruiterFooter />
          </div>
        )}
      </div>

      {/* Fixed bottom TabBar — no Résumé tab; PDF is a secondary download. */}
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
