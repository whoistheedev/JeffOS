import { useState } from "react"
import { Github, Linkedin, Mail, Briefcase } from "lucide-react"
import DesktopShell from "../DesktopShell"

/**
 * 📱 MobileShell — FOUNDATION SCAFFOLD (not the full mobile redesign).
 *
 * Phase 3 delivers only the shell architecture. The full mobile UX from
 * MOBILE_STRATEGY.md (fixed TabBar, full-screen app stack, More drawer) lands
 * in a later phase. Until then this scaffold gives a mobile visitor an
 * accessible landing — identity + Tier-0 links — instead of a broken
 * floating-window desktop. It also
 * offers an explicit opt-in escape hatch into the full JeffOS desktop so no
 * functionality is lost.
 */
export default function MobileShell() {
  const [showFullOS, setShowFullOS] = useState(false)

  if (showFullOS) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <DesktopShell />
        <button
          onClick={() => setShowFullOS(false)}
          className="fixed top-2 right-2 z-[200] rounded-full bg-black/70 px-3 py-1 text-xs text-white shadow-lg"
        >
          ← Exit JeffOS
        </button>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen w-screen flex-col bg-gradient-to-b from-[#1e2a44] to-[#0f1626] px-6 py-10 text-white">
      <header className="mt-6">
        <p className="text-sm text-white/60">Hi, I'm</p>
        <h1 className="text-3xl font-semibold">Jeff Idodo</h1>
        <p className="mt-1 text-lg text-white/80">Full-Stack Developer</p>
      </header>

      {/* Tier-0 hire actions */}
      <nav aria-label="Primary" className="mt-8 grid grid-cols-1 gap-3">
        <button
          onClick={() => setShowFullOS(true)}
          className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-4 text-left text-base font-medium backdrop-blur transition-colors hover:bg-white/15"
        >
          <Briefcase size={20} aria-hidden="true" /> Projects &amp; full JeffOS
        </button>
        <a
          href="mailto:jeffreyjidodo@gmail.com"
          className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-4 text-base font-medium backdrop-blur transition-colors hover:bg-white/15"
        >
          <Mail size={20} aria-hidden="true" /> Email me
        </a>
      </nav>

      {/* Socials */}
      <div className="mt-8 flex gap-5">
        <a
          href="https://github.com/whoistheedev"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-white/70 transition-colors hover:text-white"
        >
          <Github size={22} />
        </a>
        <a
          href="https://www.linkedin.com/in/jeffrey-james-idodo-4402b6390"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="text-white/70 transition-colors hover:text-white"
        >
          <Linkedin size={22} />
        </a>
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-white/40">
        Best experienced on desktop — tap “Projects &amp; full JeffOS” to explore.
      </footer>
    </main>
  )
}
