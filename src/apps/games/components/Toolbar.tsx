import React from "react"
import { Power, Monitor, Palette } from "lucide-react"

export function Toolbar({
  title,
  shader,
  onQuit,
  onShaderToggle,
}: {
  title: string
  shader: string
  onQuit: () => void
  onShaderToggle: () => void
}) {
  return (
    <div
      className="
        flex items-center justify-between
        px-3 py-1.5
        backdrop-blur-xl bg-white/10
        border-b border-white/20
        text-[11px] text-white select-none
        shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.35)]
      "
    >
      {/* Left Controls — labelled, with ≥44px touch targets (UX_AUDIT G2). */}
      <div className="flex items-center gap-2">
        {/* Quit → back to Library. Labelled, not a bare power icon. */}
        <button
          onClick={onQuit}
          className="
            flex items-center gap-1.5 px-3 rounded-md
            bg-gradient-to-b from-[#8cbcff] to-[#2b82d6]
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.4)]
            hover:brightness-110 active:scale-[0.97] transition
            text-[12px] font-medium
          "
          style={{ minHeight: "var(--touch-target-min, 44px)" }}
          title="Quit to Library"
        >
          <Power size={14} strokeWidth={1.75} /> Quit
        </button>

        {/* Shader toggle — icon + the current mode label in one control. */}
        <button
          onClick={onShaderToggle}
          className="
            flex items-center gap-1.5 px-3 rounded-md
            bg-white/15 hover:bg-white/25 active:bg-white/30
            border border-white/10 hover:border-white/20
            transition text-[12px] font-medium
          "
          style={{ minHeight: "var(--touch-target-min, 44px)" }}
          title="Toggle display shader (CRT / LCD)"
        >
          <Palette size={14} strokeWidth={1.75} />
          <span className="uppercase tracking-wide">{shader.includes("crt") ? "CRT" : "LCD"}</span>
        </button>
      </div>

      {/* Right Title */}
      <div className="flex items-center gap-1.5 text-zinc-200">
        <Monitor size={12} strokeWidth={1.25} className="opacity-80" />
        <span className="text-xs font-medium truncate max-w-[180px]">{title}</span>
      </div>

      {/* Top highlight line for cinematic glass light */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
    </div>
  )
}
