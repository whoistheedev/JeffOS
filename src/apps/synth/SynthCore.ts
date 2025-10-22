/**
 * Apple SynthCore — modular Web Audio synth engine
 * Optimized for authentic Mac OS X Tiger–era sound and responsive control.
 */

export type OscType = OscillatorType
export type ADSR = { attack: number; decay: number; sustain: number; release: number }

export interface SynthOptions {
  wave: OscType
  detune?: number
  adsr: ADSR
  filterFreq?: number
  filterQ?: number
  reverbMix?: number
  volume?: number
  pan?: number
}

/**
 * SynthCore — manages one global AudioContext + master chain.
 * Each play() call spawns a disposable voice node chain.
 */
export class SynthCore {
  ctx: AudioContext
  convolver: ConvolverNode
  master: GainNode
  limiter: DynamicsCompressorNode
  panner: StereoPannerNode
  filter: BiquadFilterNode
  analyser: AnalyserNode

  constructor(ctx?: AudioContext) {
    this.ctx = ctx ?? new AudioContext()

    // === Master chain ===
    this.master = this.ctx.createGain()
    this.limiter = this.ctx.createDynamicsCompressor()
    this.panner = this.ctx.createStereoPanner()
    this.filter = this.ctx.createBiquadFilter()
    this.filter.type = "lowpass"
    this.filter.frequency.value = 18000
    this.filter.Q.value = 1

    this.convolver = this.ctx.createConvolver()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048

    this.master.gain.value = 0.85

    // chain: filter → convolver → panner → limiter → master → analyser → destination
    this.filter.connect(this.convolver)
    this.convolver.connect(this.panner)
    this.panner.connect(this.limiter)
    this.limiter.connect(this.master)
    this.master.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    this._loadImpulse()
  }

  /** Create a lush stereo impulse response for classic “room” reverb */
  private _loadImpulse() {
    const len = this.ctx.sampleRate * 2
    const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        const fade = Math.pow(1 - i / len, 2.8)
        const noise = (Math.random() * 2 - 1) * fade
        data[i] = noise + (Math.random() - 0.5) * 0.02 // light shimmer
      }
    }
    this.convolver.buffer = impulse
  }

  /** Trigger a note with ADSR envelope and stereo voice spread */
  play(freq: number, opts: SynthOptions) {
    const {
      adsr,
      wave,
      detune = 0,
      filterFreq = 18000,
      filterQ = 1,
      reverbMix = 0.25,
      volume = 0.9,
      pan = 0,
    } = opts

    const now = this.ctx.currentTime
    const endTime = now + adsr.attack + adsr.decay + adsr.release + 1.0

    // === Oscillators ===
    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    osc1.type = wave
    osc2.type = wave
    osc1.frequency.value = freq
    osc2.frequency.value = freq
    osc2.detune.value = detune + 3 // subtle stereo detune

    // === Gain envelope ===
    const env = this.ctx.createGain()
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(volume, now + adsr.attack)
    env.gain.linearRampToValueAtTime(volume * adsr.sustain, now + adsr.attack + adsr.decay)
    env.gain.linearRampToValueAtTime(0, endTime)

    // === Per-voice filter & reverb ===
    const filter = this.ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = filterFreq
    filter.Q.value = filterQ

    const dryGain = this.ctx.createGain()
    const wetGain = this.ctx.createGain()
    dryGain.gain.value = 1 - reverbMix
    wetGain.gain.value = reverbMix

    const panNode = this.ctx.createStereoPanner()
    panNode.pan.value = pan

    // === Routing ===
    osc1.connect(env)
    osc2.connect(env)
    env.connect(filter)
    filter.connect(dryGain)
    filter.connect(wetGain)
    dryGain.connect(panNode)
    wetGain.connect(this.convolver)
    panNode.connect(this.filter)

    // === Playback ===
    osc1.start(now)
    osc2.start(now)
    osc1.stop(endTime)
    osc2.stop(endTime)

    // === Cleanup ===
    osc1.onended = () => {
      osc1.disconnect()
      osc2.disconnect()
      env.disconnect()
      filter.disconnect()
      dryGain.disconnect()
      wetGain.disconnect()
      panNode.disconnect()
    }
  }

  /** Smooth controls for live modulation */
  setFilter(freq: number, q = 1) {
    const t = this.ctx.currentTime + 0.2
    this.filter.frequency.linearRampToValueAtTime(freq, t)
    this.filter.Q.linearRampToValueAtTime(q, t)
  }

  setMasterVolume(v: number) {
    this.master.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.2)
  }

  setPan(v: number) {
    this.panner.pan.linearRampToValueAtTime(v, this.ctx.currentTime + 0.2)
  }
}
