import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import AppleKnob from "./AppleKnob"
import { SynthCore, type ADSR } from "./SynthCore"

// --- Note Data ---
interface NoteData {
  name: string
  color: "white" | "black"
}
interface FullNote {
  note: string
  freq: number
  color: "white" | "black"
}

const BASE_NOTES: NoteData[] = [
  { name: "C", color: "white" },
  { name: "C#", color: "black" },
  { name: "D", color: "white" },
  { name: "D#", color: "black" },
  { name: "E", color: "white" },
  { name: "F", color: "white" },
  { name: "F#", color: "black" },
  { name: "G", color: "white" },
  { name: "G#", color: "black" },
  { name: "A", color: "white" },
  { name: "A#", color: "black" },
  { name: "B", color: "white" },
]

function generateNotes(octaveOffset: number): FullNote[] {
  return Array.from({ length: 4 }, (_, octave) =>
    BASE_NOTES.map((n, idx) => ({
      note: `${n.name}${octave + 2 + octaveOffset}`,
      freq: 440 * Math.pow(2, ((octave * 12 + idx - 9 + octaveOffset * 12) / 12)),
      color: n.color,
    }))
  ).flat()
}

// --- Keyboard Map ---
const KEYBOARD_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8,
  h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ";": 16,
  "'": 17, z: 18, x: 19, c: 20, v: 21, b: 22, n: 23, m: 24,
}

// --- Presets ---
const PRESETS = {
  "Warm Pad": {
    wave: "triangle" as OscillatorType,
    adsr: { attack: 0.4, decay: 0.3, sustain: 0.8, release: 1.5 },
    filter: 8000,
    reverb: 0.45,
    volume: 0.8,
  },
  "Analog Bass": {
    wave: "square" as OscillatorType,
    adsr: { attack: 0.02, decay: 0.25, sustain: 0.6, release: 0.2 },
    filter: 3000,
    reverb: 0.1,
    volume: 0.9,
  },
  "Pluck Lead": {
    wave: "sawtooth" as OscillatorType,
    adsr: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.25 },
    filter: 10000,
    reverb: 0.25,
    volume: 0.85,
  },
  "Crystal Keys": {
    wave: "sine" as OscillatorType,
    adsr: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.8 },
    filter: 15000,
    reverb: 0.35,
    volume: 0.75,
  },
}

export default function Synth() {
  const synthRef = useRef<SynthCore | null>(null)
  const [power, setPower] = useState(true)
  const [active, setActive] = useState<string[]>([])
  const [wave, setWave] = useState<OscillatorType>("sine")
  const [adsr, setAdsr] = useState<ADSR>({ attack: 0.03, decay: 0.25, sustain: 0.7, release: 0.3 })
  const [filter, setFilter] = useState(18000)
  const [volume, setVolume] = useState(0.8)
  const [reverb, setReverb] = useState(0.25)
  const [led, setLed] = useState(false)
  const [octaveShift, setOctaveShift] = useState(0)
  const [preset, setPreset] = useState("Custom")
  const [notes, setNotes] = useState<FullNote[]>(() => generateNotes(0))

  // --- Initialize SynthCore ---
  useEffect(() => {
    synthRef.current = new SynthCore()
    return () => {
      synthRef.current?.ctx.close()
    }
  }, [])

  // --- Power Toggle ---
  const togglePower = () => {
    if (!synthRef.current) return
    const ctx = synthRef.current.ctx
    if (power) {
      ctx.suspend()
      setLed(false)
    } else {
      ctx.resume()
      setLed(true)
    }
    setPower(!power)
  }

  // --- Apply Preset ---
  const applyPreset = (name: string) => {
    const p = PRESETS[name as keyof typeof PRESETS]
    if (!p) return
    setWave(p.wave)
    setAdsr(p.adsr)
    setFilter(p.filter)
    setReverb(p.reverb)
    setVolume(p.volume)
    setPreset(name)
    setLed(true)
    setTimeout(() => setLed(false), 200)
  }

  // --- Regenerate Notes ---
  useEffect(() => setNotes(generateNotes(octaveShift)), [octaveShift])

  // --- Play Sound ---
  const play = (freq: number, id: string) => {
    if (!power) return
    synthRef.current?.play(freq, { wave, adsr, filterFreq: filter, reverbMix: reverb, volume })
    setActive((p) => [...p, id])
    setLed(true)
    setTimeout(() => setLed(false), 100)
    setTimeout(() => setActive((p) => p.filter((x) => x !== id)), 200)
  }

  // --- Keyboard Controls ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const idx = KEYBOARD_MAP[e.key.toLowerCase()]
      if (idx === undefined || idx >= notes.length) return
      const note = notes[idx]
      if (active.includes(note.note)) return
      play(note.freq, note.note)
    }
    const up = (e: KeyboardEvent) => {
      const idx = KEYBOARD_MAP[e.key.toLowerCase()]
      if (idx === undefined || idx >= notes.length) return
      const note = notes[idx]
      setActive((p) => p.filter((n) => n !== note.note))
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [wave, adsr, filter, reverb, volume, notes, active, power])

  const waveOptions: OscillatorType[] = ["sine", "square", "triangle", "sawtooth"]
  const shiftOctave = (dir: "up" | "down") =>
    setOctaveShift((prev) => Math.max(-2, Math.min(2, dir === "up" ? prev + 1 : prev - 1)))

  // --- UI ---
  return (
    <div
      className="relative flex flex-col text-white select-none overflow-hidden
      bg-[linear-gradient(135deg,#7d7d7d_0%,#b3b3b3_25%,#a1a1a1_50%,#888_75%,#777_100%)]
      border border-neutral-500 shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_8px_14px_rgba(0,0,0,0.7)] w-full h-full"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-neutral-100 to-neutral-300 border-b border-neutral-500">
        {/* POWER */}
        <div className="flex items-center gap-3 text-neutral-700 font-semibold">
          <motion.div
            animate={{ opacity: power ? 1 : 0.2 }}
            className={`w-3 h-3 rounded-full ${power ? "bg-green-400" : "bg-gray-700"} shadow-[0_0_8px_#00ff88]`}
          />
          <button
            onClick={togglePower}
            className={`relative w-10 h-6 rounded-full border border-neutral-500 transition-all ${
              power
                ? "bg-gradient-to-b from-green-300 to-green-700 shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]"
                : "bg-gradient-to-b from-gray-300 to-gray-600 shadow-inner"
            }`}
          >
            <div
              className={`absolute top-0.5 ${power ? "right-0.5" : "left-0.5"} w-5 h-5 bg-white rounded-full 
              shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.4)] transition-all`}
            />
          </button>
          <span className="text-sm">Power</span>
        </div>

        {/* PRESETS */}
        <div className="flex items-center gap-2">
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
            className="text-sm px-2 py-1 border border-neutral-400 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300"
            disabled={!power}
          >
            <option value="Custom">Custom</option>
            {Object.keys(PRESETS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* WAVE BUTTONS */}
          <div className="flex gap-1 ml-2">
            {waveOptions.map((w) => (
              <button
                key={w}
                onClick={() => setWave(w)}
                disabled={!power}
                className={`px-2 py-1 text-xs border border-neutral-400 transition-all ${
                  wave === w && power
                    ? "bg-neutral-700 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"
                    : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                } disabled:opacity-50`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DISPLAY */}
      <div className="relative flex flex-col items-center justify-center h-20 border-y border-neutral-600 
          bg-[linear-gradient(180deg,#0b0b0b_0%,#1a1a1a_60%,#0d0d0d_100%)] shadow-inner overflow-hidden">
        <div className={`absolute bottom-1 font-mono text-xs tracking-wider ${power ? "text-green-400" : "text-neutral-600"}`}>
          {power ? `${preset} • ${wave.toUpperCase()} • ${Math.round(filter)}Hz` : "STANDBY"}
        </div>
      </div>

      {/* KNOBS */}
      <div className={`grid grid-cols-7 gap-2 p-1.5 border-b border-neutral-700 shadow-inner w-full transition-opacity ${
        power ? "bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900" : "bg-neutral-800/50 opacity-40"
      }`}>
        <AppleKnob label="Atk" value={adsr.attack} onChange={(v) => setAdsr({ ...adsr, attack: v })} />
        <AppleKnob label="Dec" value={adsr.decay} onChange={(v) => setAdsr({ ...adsr, decay: v })} />
        <AppleKnob label="Sus" value={adsr.sustain} onChange={(v) => setAdsr({ ...adsr, sustain: v })} />
        <AppleKnob label="Rel" value={adsr.release} onChange={(v) => setAdsr({ ...adsr, release: v })} />
        <AppleKnob label="Filt" value={filter / 20000} onChange={(v) => setFilter(v * 20000)} />
        <AppleKnob label="Verb" value={reverb} onChange={setReverb} />
        <AppleKnob label="Vol" value={volume} onChange={setVolume} />
      </div>

      {/* KEYBOARD */}
      <div className={`relative flex-1 border-t border-neutral-500 flex justify-center items-end pb-1 transition-opacity ${
        power ? "bg-gradient-to-b from-neutral-200 to-neutral-400" : "bg-neutral-300 opacity-50"
      }`}>
        <div className="flex relative">
          <div className="flex z-0">
            {notes
              .filter((n) => n.color === "white")
              .map((n: FullNote) => (
                <motion.div
                  key={n.note}
                  whileTap={{ scaleY: 0.97 }}
                  onMouseDown={() => play(n.freq, n.note)}
                  className={`relative w-12 h-44 border border-neutral-500 transition-all duration-100 ${
                    active.includes(n.note)
                      ? "bg-gradient-to-b from-blue-200 to-blue-400 shadow-[0_0_10px_#5ab3ff]"
                      : "bg-gradient-to-b from-white to-neutral-200 hover:from-neutral-100"
                  }`}
                >
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-neutral-700">
                    {n.note}
                  </span>
                </motion.div>
              ))}
          </div>

          <div className="absolute top-0 left-0 right-0 flex justify-start pointer-events-none z-10">
            {notes
              .filter((n) => n.color === "black")
              .map((n: FullNote) => (
                <motion.div
                  key={n.note}
                  whileTap={{ scaleY: 0.96 }}
                  onMouseDown={() => play(n.freq, n.note)}
                  className={`pointer-events-auto w-8 h-28 ml-[18px] mr-[18px] transition-all duration-100 ${
                    active.includes(n.note)
                      ? "bg-gradient-to-b from-blue-900 to-blue-600 shadow-[0_0_8px_#4db4ff]"
                      : "bg-gradient-to-b from-black to-neutral-800 hover:from-neutral-700"
                  }`}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
