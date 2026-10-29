import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "../../lib/utils"
import { buttonClass } from "./ui"
import { CONTACT } from "../content"

/**
 * Shared recruiter-experience primitives: Mac window chrome, the button
 * hierarchy, section headers and chips. One definition each so the front door
 * and the JeffOS "Hire Me" window stay visually identical (Law of Similarity).
 */

/* ------------------------------ Mac chrome -------------------------------- */
export function TrafficLights({ size = 11 }: { size?: number }) {
  return (
    <span className="flex items-center gap-[6px]" aria-hidden>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <span
          key={c}
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: c,
            boxShadow: "inset 0 0.5px 0 rgb(255 255 255 / 0.6), 0 0.5px 1px rgb(0 0 0 / 0.3)",
          }}
        />
      ))}
    </span>
  )
}

/**
 * A classic-Mac window panel: gradient title bar with traffic lights and a
 * centered title, hairline border, controlled shadow. Purely presentational —
 * the traffic lights are decoration, not controls.
 */
export function MacPanel({
  title,
  children,
  className,
  bodyClassName,
  as: Tag = "div",
  labelledBy,
}: {
  title: string
  children: ReactNode
  className?: string
  bodyClassName?: string
  as?: "div" | "section" | "aside"
  labelledBy?: string
}) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cn(
        "overflow-hidden rounded-[10px] border border-foreground/12 bg-background shadow-[var(--rx-panel-shadow)]",
        className
      )}
    >
      <div
        className="relative flex h-7 items-center border-b border-foreground/10 px-2.5"
        style={{ background: "var(--rx-titlebar)" }}
      >
        <TrafficLights />
        <p
          className="pointer-events-none absolute inset-x-16 truncate text-center text-[12px] font-medium"
          style={{ color: "var(--rx-titlebar-text)" }}
        >
          {title}
        </p>
      </div>
      <div className={bodyClassName}>{children}</div>
    </Tag>
  )
}

/** Monogram "app icon" — the engineer's identity mark (graphite Aqua tile). */
export function Monogram({ initials, size = 64 }: { initials: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center font-semibold tracking-tight text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        fontSize: size * 0.38,
        background: "linear-gradient(to bottom, #4a5262 0%, #2a2f39 55%, #1d2129 100%)",
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.22), 0 2px 6px rgb(0 0 0 / 0.25)",
      }}
    >
      {initials}
    </span>
  )
}

/* ------------------------------ typography -------------------------------- */
/**
 * Swiss section header: mono index + rule + kicker, then the heading. The
 * repeated index/rule gives the page one continuous scanning rhythm
 * (Law of Continuity).
 */
export function SectionHeader({
  index,
  kicker,
  title,
  lead,
  id,
}: {
  index: string
  kicker: string
  title: string
  lead?: string
  id: string
}) {
  return (
    <header className="mb-8 @3xl:mb-10">
      <div className="rx-mono flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>{index}</span>
        <span aria-hidden className="h-px flex-1 bg-border" />
        <span>{kicker}</span>
      </div>
      <h2 id={id} className="mt-5 max-w-[24ch] scroll-mt-24 focus:outline-none text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-balance @3xl:text-[36px]">
        {title}
      </h2>
      {lead && <p className="mt-3 max-w-[60ch] text-[15px] leading-6 text-muted-foreground">{lead}</p>}
    </header>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rx-mono inline-flex items-center rounded-[5px] border border-foreground/12 px-1.5 py-0.5 text-[11px] leading-4 text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Green "system status" dot. Pulses only when motion is allowed. */
export function LiveDot() {
  return <span aria-hidden className="rx-pulse inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-live)]" />
}

/* ------------------------------ copy email -------------------------------- */
/**
 * Copies the email address and announces the result in a polite live region.
 * Clipboard failures (permissions, insecure context) are reported instead of
 * throwing, with the address shown so it can still be copied by hand.
 */
export function CopyEmailButton({ className, size = "md" }: { className?: string; size?: "md" | "sm" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(CONTACT.email)
      setState("copied")
    } catch {
      setState("failed")
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState("idle"), 2400)
  }

  return (
    <>
      <button type="button" onClick={copy} className={cn(buttonClass("secondary", size), className)}>
        {state === "copied" ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        {state === "copied" ? "Copied" : "Copy Address"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied" && `Email address copied: ${CONTACT.email}`}
        {state === "failed" && `Couldn't copy automatically. The address is ${CONTACT.email}`}
      </span>
    </>
  )
}
