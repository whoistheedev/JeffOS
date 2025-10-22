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
      {/* Left Controls */}
      <div className="flex items-center gap-3">
        {/* Quit Button */}
        <button
          onClick={onQuit}
          className="
            p-[5px] rounded-md 
            bg-gradient-to-b from-[#8cbcff] to-[#2b82d6]
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.4)]
            hover:brightness-110 active:scale-[0.97] transition
          "
          title="Quit"
        >
          <Power size={12} strokeWidth={1.5} />
        </button>

        {/* Shader Toggle */}
        <button
          onClick={onShaderToggle}
          className="
            p-[5px] rounded-md
            bg-white/15 hover:bg-white/25 active:bg-white/30
            border border-white/10 hover:border-white/20
            transition
          "
          title="Toggle Shader"
        >
          <Palette size={12} strokeWidth={1.5} />
        </button>

        {/* Shader Label */}
        <div
          className="
            px-2 py-[3px] rounded-md uppercase tracking-wide
            text-[10px] font-medium text-zinc-200
            bg-white/10 border border-white/10
            shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]
          "
        >
          {shader.includes("crt") ? "CRT" : "LCD"}
        </div>
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
