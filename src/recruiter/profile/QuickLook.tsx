import type { RefObject } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ChevronRight, FileText, Github, Linkedin, Mail, X } from "lucide-react"
import { AVAILABLE_FOR, CONTACT, FEATURED_WORK, IDENTITY, PRIMARY_CTA, RESUME_REQUEST_HREF } from "../content"
import { Chip, CopyEmailButton, Monogram, TrafficLights } from "./primitives"
import { buttonClass } from "./ui"

const EXPERTISE = ["AI-powered RCM", "EDI 837/835/277/999", "Node.js · TypeScript", "Supabase · PostgreSQL", "RLS · RBAC", "React"]

/**
 * Quick Look — "Need the essentials? Start here." Everything a recruiter needs
 * on one sheet: who, current role, featured work, expertise, contact, résumé.
 * Opens instantly (no staged animation gates the content) and is fully
 * keyboard operable; focus is trapped inside and restored on close.
 */
export function QuickLook({
  open,
  onOpenChange,
  onSelectProject,
  returnFocusTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProject: (slug: string) => void
  /** Element to refocus on close. Radix only restores focus to a Dialog.Trigger,
   *  and Quick Look has several openers, so the caller records which one. */
  returnFocusTo: RefObject<HTMLElement | null>
}) {
  const section = "border-t border-border px-6 py-5"
  const label = "rx-mono mb-2.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          // Stop Escape here: JeffOS windows also close on Escape, and closing
          // Quick Look must not close the Hire Me window behind it.
          onEscapeKeyDown={(e) => e.stopPropagation()}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            returnFocusTo.current?.focus()
          }}
          className="rx fixed left-1/2 top-1/2 z-[9999] flex max-h-[min(44rem,calc(100dvh-2rem))] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[12px] border border-foreground/15 bg-background text-foreground shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)] focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none"
        >
          <div className="relative flex h-8 shrink-0 items-center border-b border-foreground/10 px-3" style={{ background: "var(--rx-titlebar)" }}>
            <TrafficLights />
            <Dialog.Title className="pointer-events-none absolute inset-x-20 truncate text-center text-[12px] font-medium" style={{ color: "var(--rx-titlebar-text)" }}>
              Quick Look — The Essentials
            </Dialog.Title>
            <Dialog.Close
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)]"
              aria-label="Close Quick Look"
            >
              <X size={16} aria-hidden />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto">
            <div className="flex items-center gap-4 px-6 py-5">
              <Monogram initials={IDENTITY.initials} size={52} />
              <div className="min-w-0">
                <p className="text-[19px] font-semibold leading-tight tracking-[-0.01em]">{IDENTITY.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {IDENTITY.title} · {IDENTITY.org} · {CONTACT.location}
                </p>
              </div>
            </div>
            <Dialog.Description className="px-6 pb-5 text-[15px] leading-6">{IDENTITY.plainEnglish}</Dialog.Description>

            <div className={section}>
              <h3 className={label}>Featured work</h3>
              <ul className="-mx-2">
                {FEATURED_WORK.map((w) => (
                  <li key={w.slug}>
                    <button
                      type="button"
                      onClick={() => onSelectProject(w.slug)}
                      className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium">{w.name}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">{w.summary}</span>
                      </span>
                      <ChevronRight size={15} aria-hidden className="text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={section}>
              <h3 className={label}>Core expertise</h3>
              <ul className="flex flex-wrap gap-1.5">
                {EXPERTISE.map((e) => (
                  <li key={e}>
                    <Chip>{e}</Chip>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
                <span className="font-medium text-foreground">Open to:</span> {AVAILABLE_FOR.join(" · ")}
              </p>
            </div>

            <div className={section}>
              <h3 className={label}>Contact</h3>
              <p className="rx-mono select-all text-[14px]">{CONTACT.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={PRIMARY_CTA.href} className={buttonClass("primary", "sm")}>
                  <Mail size={15} aria-hidden /> {PRIMARY_CTA.label}
                </a>
                <CopyEmailButton size="sm" />
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4" aria-label="Profiles and résumé">
                <li>
                  <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" className={buttonClass("tertiary", "sm")}>
                    <Linkedin size={15} aria-hidden /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
                <li>
                  <a href={CONTACT.github} target="_blank" rel="noopener noreferrer" className={buttonClass("tertiary", "sm")}>
                    <Github size={15} aria-hidden /> GitHub<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
                <li>
                  <a href={RESUME_REQUEST_HREF} className={buttonClass("tertiary", "sm")}>
                    <FileText size={15} aria-hidden /> Request résumé (PDF)
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="rx-mono shrink-0 border-t border-border bg-muted/50 px-6 py-2 text-[11px] text-muted-foreground">Esc to close</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
