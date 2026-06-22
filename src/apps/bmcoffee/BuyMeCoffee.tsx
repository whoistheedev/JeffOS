import { Coffee, Heart, ExternalLink } from "lucide-react"
import { brushedMetalBar, aquaBlueButton, tigerFont } from "../../lib/aquaSkin"

const BMC_URL = "https://www.buymeacoffee.com/whoistheedev"

/**
 * Buy Me a Coffee — a self-contained Tiger-skinned support card.
 *
 * The old version embedded the external buymeacoffee widget script, which
 * didn't reliably render inside the window and left a bare "☕ Buy me a coffee"
 * link floating in empty space (UX_AUDIT_JEFFOS_APPS). This presents a proper
 * card with the CTA, a short note, and a couple of quick-pick amounts — all
 * Aqua-skinned and centered, on both desktop and mobile.
 */
function AmountChip({ amount }: { amount: number }) {
  return (
    <a
      href={`${BMC_URL}?amount=${amount}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all active:scale-95"
      style={{
        background: "linear-gradient(to bottom, #fdfdfd, #d2d2d2)",
        border: "1px solid #9a9a9a",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 1px rgba(0,0,0,0.15)",
        color: "#333",
      }}
    >
      ☕ × {amount}
    </a>
  )
}

export default function BuyMeCoffeeApp() {
  return (
    <div className="flex h-full w-full flex-col bg-[#ececec]" style={{ fontFamily: tigerFont }}>
      {/* Brushed-metal title strip, like the other Tiger apps. */}
      <div className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-neutral-800" style={brushedMetalBar}>
        <Coffee size={15} aria-hidden /> Buy Me a Coffee
      </div>

      {/* Centered support card */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div
          className="w-full max-w-sm rounded-xl bg-white px-6 py-7 text-center"
          style={{ border: "1px solid #c4c4c4", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 16px rgba(0,0,0,0.18)" }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(to bottom, #ffe49a, #f5b740)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.2)" }}
          >
            <Coffee size={30} className="text-[#6b4a18]" aria-hidden />
          </div>

          <h2 className="text-lg font-semibold text-neutral-900">Enjoying JeffOS?</h2>
          <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-neutral-600">
            This whole site is a hand-built macOS Tiger recreation. If it made you smile,
            a coffee keeps the late-night commits coming.
          </p>

          {/* Quick-pick amounts */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <AmountChip amount={1} />
            <AmountChip amount={3} />
            <AmountChip amount={5} />
          </div>

          {/* Primary Aqua CTA */}
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ ...aquaBlueButton, minHeight: "var(--touch-target-min)" }}
          >
            <Coffee size={16} aria-hidden /> Buy me a coffee <ExternalLink size={13} aria-hidden />
          </a>

          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-neutral-400">
            <Heart size={11} aria-hidden /> Thank you for the support
          </p>
        </div>
      </div>
    </div>
  )
}
