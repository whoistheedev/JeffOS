import { useClock } from "../../hooks/useClock"

/**
 * iPhone-OS-era status bar — the touch sibling of Tiger's menu bar. A slim,
 * pinstriped Aqua strip with the title centered, signal/wifi at left and clock +
 * battery at right. NOT the Mac menu bar (no File/Edit/View on a phone).
 */
export default function MobileStatusBar({ title = "JeffOS" }: { title?: string }) {
  const { now } = useClock()
  const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)

  return (
    <div
      className="relative flex h-6 items-center justify-between px-2 text-[11px] font-semibold text-black/80 select-none"
      style={{
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0px, rgba(0,0,0,0.04) 1px, transparent 2px),
          linear-gradient(to bottom, #f2f2f2, #d3d3d3)
        `,
        backgroundSize: "3px 100%, auto",
        borderBottom: "1px solid #8d8d8d",
        boxShadow: "inset 0 1px rgba(255,255,255,0.7)",
        paddingTop: "var(--space-safe-top, 0px)",
      }}
    >
      {/* Left: faux signal bars (era-correct) */}
      <div className="flex items-end gap-[2px]" aria-hidden>
        {[3, 5, 7, 9].map((h, i) => (
          <span key={i} style={{ width: 3, height: h, background: "rgba(0,0,0,0.7)", borderRadius: 1 }} />
        ))}
      </div>

      {/* Center: title */}
      <div className="absolute left-1/2 -translate-x-1/2 font-semibold tracking-tight">{title}</div>

      {/* Right: clock + battery */}
      <div className="flex items-center gap-1.5">
        <span className="tabular-nums">{clock}</span>
        <span
          aria-hidden
          className="relative inline-block"
          style={{ width: 18, height: 9, border: "1px solid rgba(0,0,0,0.7)", borderRadius: 2 }}
        >
          <span style={{ position: "absolute", inset: 1, width: "75%", background: "rgba(0,0,0,0.7)", borderRadius: 1 }} />
          <span style={{ position: "absolute", right: -3, top: 2, width: 2, height: 4, background: "rgba(0,0,0,0.7)", borderRadius: 1 }} />
        </span>
      </div>
    </div>
  )
}
