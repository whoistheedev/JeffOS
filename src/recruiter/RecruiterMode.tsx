import { useState } from "react"
import { Home, FolderGit2, Clock, Mail, Calendar, Github, Linkedin, ArrowUpRight, Sun, Moon } from "lucide-react"
import { useFormFactor } from "../hooks/useFormFactor"
import { useRecruiterTheme } from "./useRecruiterTheme"
import ErrorBoundary from "../components/ErrorBoundary"
import {
  Hero,
  StatBand,
  CurrentImpact,
  ArchitectureHighlights,
  FeaturedAchievement,
  FeaturedWork,
  WhyHire,
  ExperienceTimeline,
  AvailableFor,
  JeffOSCallout,
} from "./components/sections"
import { ContactActions } from "./components/HireMeSheet"
import { IDENTITY, CONTACT, TRUST_INDICATORS } from "./content"

/**
 * Recruiter Mode — premium executive engineering profile.
 *
 * Positions Jeffrey as a systems engineer building business-critical healthcare
 * infrastructure (EDI / RCM / multi-tenant / Supabase). Conversations happen via
 * Schedule / email / socials.
 *
 * Layout per form factor (genuinely responsive, not one column stretched):
 *   - desktop (≥1024): sticky left Sidebar (identity + CTAs + nav + socials) +
 *     scrolling content column on a wide canvas.
 *   - tablet (768–1023): centered single-column reading spine.
 *   - mobile: bottom-tab app (Home · Projects · Experience · Contact).
 */
export default function RecruiterMode({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  const formFactor = useFormFactor()
  // User-controllable dark mode (defaults to OS preference). Scoped to Recruiter
  // Mode so it never fights JeffOS theming.
  const { isDark, toggle } = useRecruiterTheme()

  const shared = { onLaunchJeffOS, isDark, toggleTheme: toggle }

  return (
    <ErrorBoundary label="Recruiter Mode">
      {formFactor === "mobile" ? (
        <RecruiterMobile {...shared} />
      ) : formFactor === "tablet" ? (
        <RecruiterTablet {...shared} />
      ) : (
        <RecruiterDesktop {...shared} />
      )}
    </ErrorBoundary>
  )
}

/** Reusable dark-mode toggle icon button. */
function ThemeToggle({ isDark, toggleTheme, className = "" }: { isDark: boolean; toggleTheme: () => void; className?: string }) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={"inline-flex items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground " + className}
      style={{ width: 36, height: 36 }}
    >
      {isDark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  )
}

type LayoutProps = { onLaunchJeffOS: () => void; isDark: boolean; toggleTheme: () => void }

const scheduleHref = () =>
  CONTACT.schedulerUrl ?? `mailto:${CONTACT.email}?subject=Let's%20talk`

const NAV = [
  { id: "impact", label: "Current Impact" },
  { id: "architecture", label: "Architecture" },
  { id: "work", label: "Featured Work" },
  { id: "why", label: "Why Hire" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/* -------------------------------- Sidebar -------------------------------- */
function Sidebar({ onLaunchJeffOS, isDark, toggleTheme }: LayoutProps) {
  return (
    <aside className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight">
          {IDENTITY.name}
        </h1>
        <p className="mt-2 text-sm font-medium">
          {IDENTITY.title} · {IDENTITY.org}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{IDENTITY.tagline}</p>
      </div>

      <div className="flex flex-col gap-2">
        {/* Primary */}
        <a
          href={scheduleHref()}
          target={CONTACT.schedulerUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)", minHeight: "var(--touch-target-min)" }}
        >
          <Calendar size={16} aria-hidden /> Schedule a Conversation
        </a>
        {/* Secondary */}
        <button
          onClick={() => scrollTo("work")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          <FolderGit2 size={16} aria-hidden /> View Projects
        </button>
        {/* Tertiary — quiet */}
        <button
          onClick={onLaunchJeffOS}
          className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Launch JeffOS <ArrowUpRight size={14} aria-hidden />
        </button>
      </div>

      <nav aria-label="Sections" className="hidden flex-col gap-1 lg:flex">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => scrollTo(n.id)}
            className="rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap gap-1.5">
        {TRUST_INDICATORS.map((t) => (
          <span key={t} className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] tracking-tight text-muted-foreground">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-muted-foreground">
          <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-foreground"><Linkedin size={18} /></a>
          <a href={CONTACT.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-foreground"><Github size={18} /></a>
          <a href={`mailto:${CONTACT.email}`} aria-label="Email" className="hover:text-foreground"><Mail size={18} /></a>
        </div>
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </div>
    </aside>
  )
}

function RecruiterFooter() {
  return (
    <footer className="mt-12 border-t border-border pt-6 pb-[max(1rem,var(--space-safe-bottom))] text-xs text-muted-foreground">
      © {IDENTITY.name}
    </footer>
  )
}

/* ----------------------------- Premium Contact ---------------------------- */
function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-8">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contact</h2>
      <p className="mb-5 max-w-prose text-[15px] leading-relaxed">
        Let's talk about systems worth building.
      </p>
      <ContactActions />
    </section>
  )
}

/** The scrolling content column (shared by desktop + tablet). */
function ContentColumn({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  return (
    <div className="space-y-14">
      <StatBand />
      <CurrentImpact />
      <ArchitectureHighlights />
      <FeaturedAchievement />
      <FeaturedWork />
      <WhyHire />
      <ExperienceTimeline />
      <AvailableFor />
      <JeffOSCallout onLaunchJeffOS={onLaunchJeffOS} />
      <ContactSection />
    </div>
  )
}

/* --------------------------------- Desktop -------------------------------- */
function RecruiterDesktop({ onLaunchJeffOS, isDark, toggleTheme }: LayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-[20rem_minmax(0,1fr)] gap-12 px-8 py-12 xl:gap-16">
        {/* Sticky identity rail */}
        <div className="sticky top-12 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
          <Sidebar onLaunchJeffOS={onLaunchJeffOS} isDark={isDark} toggleTheme={toggleTheme} />
        </div>
        {/* Scrolling content */}
        <div>
          {/* Headline lead — the AI-RCM statement the sidebar identity supports */}
          <div className="mb-10">
            <h2 className="max-w-[20ch] text-4xl font-semibold leading-[1.05] tracking-tight">
              {IDENTITY.headline}
            </h2>
            <p className="mt-3 max-w-prose text-base text-muted-foreground">{IDENTITY.subtitle}</p>
          </div>
          <ContentColumn onLaunchJeffOS={onLaunchJeffOS} />
          <RecruiterFooter />
        </div>
      </div>
    </main>
  )
}

/* --------------------------------- Tablet --------------------------------- */
function RecruiterTablet({ onLaunchJeffOS, isDark, toggleTheme }: LayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-3 flex justify-end">
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
        </div>
        <div className="mb-12">
          <Hero onLaunchJeffOS={onLaunchJeffOS} />
        </div>
        <ContentColumn onLaunchJeffOS={onLaunchJeffOS} />
        <RecruiterFooter />
      </div>
    </main>
  )
}

/* --------------------------------- Mobile --------------------------------- */
type Tab = "home" | "projects" | "experience" | "contact"

function RecruiterMobile({ onLaunchJeffOS, isDark, toggleTheme }: LayoutProps) {
  const [tab, setTab] = useState<Tab>("home")
  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "experience", label: "Experience", icon: Clock },
    { id: "contact", label: "Contact", icon: Mail },
  ]

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      {/* Top bar: theme toggle always reachable */}
      <div className="flex justify-end px-5 pt-[max(0.75rem,var(--space-safe-top))]">
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-24">
        {tab === "home" && (
          <div className="space-y-12">
            <Hero onLaunchJeffOS={onLaunchJeffOS} />
            <StatBand />
            <CurrentImpact />
            <ArchitectureHighlights />
            <FeaturedAchievement />
            <WhyHire />
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

      {/* Fixed bottom TabBar — Home · Projects · Experience · Contact. */}
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
