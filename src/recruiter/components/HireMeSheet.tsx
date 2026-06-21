import { useState } from "react"
import { Calendar, Mail, Copy, Github, Linkedin, FileText } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../components/ui/drawer"
import { CONTACT, IDENTITY } from "../content"
import { supabase } from "../../lib/supabase"

/**
 * Contact funnel (§8). Primary CTA: "Schedule a Conversation".
 * Until CONTACT.schedulerUrl is set, the primary CTA falls back to mailto.
 * Used on mobile as a bottom sheet (vaul); the inner <ContactActions> is
 * reused inline on desktop/tablet.
 */
function resumeUrl() {
  return supabase.storage.from(IDENTITY.resumeBucket).getPublicUrl(IDENTITY.resumeFile).data
    ?.publicUrl
}

export function ContactActions({ onAnalytics }: { onAnalytics?: (e: string) => void }) {
  const [copied, setCopied] = useState(false)
  // TODO(Phase 6 §15): replace onAnalytics with the real event beacon.
  const track = (e: string) => onAnalytics?.(e)

  const scheduleHref = CONTACT.schedulerUrl ?? `mailto:${CONTACT.email}?subject=Let's%20talk`

  const row =
    "flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm"
  const touch = { minHeight: "var(--touch-target-min)" }

  return (
    <div className="flex flex-col gap-2">
      {/* Primary CTA */}
      <a
        href={scheduleHref}
        target={CONTACT.schedulerUrl ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={() => track("schedule")}
        className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
        style={{ background: "var(--color-hire)", color: "var(--color-hire-foreground)", ...touch }}
      >
        <Calendar size={18} aria-hidden /> Schedule a Conversation
        {!CONTACT.schedulerUrl && (
          /* CONFIRM: add a Cal.com/Calendly URL to CONTACT.schedulerUrl */
          <span className="sr-only"> (opens email until a scheduler is configured)</span>
        )}
      </a>

      {/* Email + copy */}
      <div className={row} style={touch}>
        <Mail size={16} aria-hidden />
        <a href={`mailto:${CONTACT.email}`} onClick={() => track("email")} className="flex-1 truncate">
          {CONTACT.email}
        </a>
        <button
          aria-label="Copy email address"
          onClick={async () => {
            await navigator.clipboard.writeText(CONTACT.email)
            setCopied(true)
            track("copy_email")
            setTimeout(() => setCopied(false), 1500)
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <Copy size={16} aria-hidden />
        </button>
        {copied && <span className="text-xs text-muted-foreground">copied</span>}
      </div>

      <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => track("linkedin")} className={row} style={touch}>
        <Linkedin size={16} aria-hidden /> LinkedIn
      </a>
      <a href={CONTACT.github} target="_blank" rel="noopener noreferrer" onClick={() => track("github")} className={row} style={touch}>
        <Github size={16} aria-hidden /> GitHub
      </a>
      <a href={resumeUrl() ?? "#"} download onClick={() => track("resume_download")} className={row} style={touch}>
        <FileText size={16} aria-hidden /> Download résumé
      </a>
    </div>
  )
}

/** Mobile/sheet wrapper. `trigger` is the element that opens the sheet. */
export function HireMeSheet({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Let's work together</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-[max(1rem,var(--space-safe-bottom))]">
          <ContactActions />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default HireMeSheet
