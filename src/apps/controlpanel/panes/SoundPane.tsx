// src/apps/controlpanel/panes/SoundPane.tsx
import React from "react";
import { Slider } from "@/components/ui/slider";
import { useStore } from "../../../store";

export default function SoundPane() {
  const soundOn = useStore((s) => s.prefs.soundOn);
  const volume = useStore((s) => s.prefs.volume);

  // ✅ actions live on the root slice
  const toggleSound = useStore((s) => s.toggleSound);
  const setVolume = useStore((s) => s.setVolume);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Output</h3>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleSound}
          className="px-2 py-1 rounded border"
          aria-pressed={soundOn}
        >
          {soundOn ? "Mute" : "Unmute"}
        </button>

        <div className="flex items-center gap-2 w-56">
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[volume]}
            onValueChange={(vals: number[]) => {
              const v = vals?.[0];
              if (typeof v === "number") setVolume(v);
            }}
            aria-label="Volume"
          />
          <span className="w-10 text-right tabular-nums">
            {(volume * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
