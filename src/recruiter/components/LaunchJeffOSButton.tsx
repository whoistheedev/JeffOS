import { ArrowUpRight } from "lucide-react"

/**
 * LaunchJeffOSButton — the distinctive, OS-flavored CTA that *sells* JeffOS.
 *
 * Per UX_AUDIT_JEFFOS_ENTRY: JeffOS is the portfolio's most differentiating
 * asset but was a tiny tertiary text link. This promotes it to a confident #2
 * CTA (after "Schedule") — a framed, glossy button with a Tiger traffic-light
 * motif and a payoff subline, so it reads as "the cool thing," not a footnote.
 *
 * Two sizes:
 *   - "full"    — two-line card-style CTA (sidebar + mobile hero), sells the OS.
 *   - "compact" — single-line pill (desktop hero row, beside Schedule).
 */
export function LaunchJeffOSButton({
  onClick,
  variant = "full",
  className = "",
}: {
  onClick: () => void
  variant?: "full" | "compact"
  className?: string
}) {
  // Tiger traffic-light dots — an instant "this is an OS" cue.
  const TrafficLights = ({ size = 9 }: { size?: number }) => (
    <span className="flex items-center gap-1" aria-hidden>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <span
          key={c}
          style={{
            width: size,
            height: size,
            borderRadius: 999,
            background: c,
            boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.6), 0 0.5px 1px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </span>
  )

  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className={
          "group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] " +
          className
        }
        style={{
          // Aqua-graphite gel so it reads as "an OS", distinct from the flat CTAs.
          background: "linear-gradient(to bottom, #3a4252, #20252e)",
          border: "1px solid #11151b",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.35)",
          minHeight: "var(--touch-target-min)",
        }}
      >
        <TrafficLights />
        Launch JeffOS
        <ArrowUpRight size={15} aria-hidden className="opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    )
  }

  // "full" — the sells-the-OS card CTA.
  return (
    <button
      onClick={onClick}
      className={
        "group relative w-full overflow-hidden rounded-xl px-4 py-3 text-left text-white transition-all active:scale-[0.99] " +
        className
      }
      style={{
        background: "linear-gradient(to bottom, #3a4252, #20252e)",
        border: "1px solid #11151b",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 16px rgba(0,0,0,0.25)",
        minHeight: "var(--touch-target-min)",
      }}
    >
      {/* glossy top sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)" }}
      />
      <div className="relative flex items-center gap-3">
        <TrafficLights size={10} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px] font-semibold leading-tight">
            Launch JeffOS
            <ArrowUpRight size={15} aria-hidden className="opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-0.5 truncate text-[12px] leading-tight text-white/65">
            Boot my macOS Tiger desktop — built from scratch
          </div>
        </div>
      </div>
    </button>
  )
}
