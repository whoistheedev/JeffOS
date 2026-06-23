import React, { useEffect, useRef, useState } from "react"
import { Sidebar } from "./components/Sidebar"
import { Toolbar } from "./components/Toolbar"
import { TrackTable } from "./components/TrackTable"
import { PlayerBar } from "./components/PlayerBar"
import { useFormFactor } from "../../hooks/useFormFactor"
import { motion, AnimatePresence } from "framer-motion"

declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export default function iTunesApp() {
  const isMobile = useFormFactor() === "mobile"
  const [currentTrack, setCurrentTrack] = useState<any | null>(null)
  const [player, setPlayer] = useState<any | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  // Always holds the LATEST access token. The Web Playback SDK's getOAuthToken
  // callback closes over whatever it reads at call time, so reading from a ref
  // (not the `token` state captured in the effect closure) lets the SDK pick up
  // refreshed tokens when its current one expires — without rebuilding the
  // player. This is what keeps "personal" playback alive past the 1-hour token
  // lifetime for a tab left open.
  const tokenRef = useRef<string | null>(null)
  // True once the first token has arrived — gates the one-time SDK setup so the
  // player isn't rebuilt on every token refresh.
  const [tokenReady, setTokenReady] = useState(false)
  // Latest playlist URI (ref, not state): the SDK effect is stable and doesn't
  // re-run on refresh, and the "ready"/control helpers read the current value.
  const playlistUriRef = useRef<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [mode, setMode] = useState<"personal" | "fallback" | "loading">("loading")
  const [reconnecting, setReconnecting] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  // This visitor's SDK device id — needed to drive transfer + REST next/prev.
  const deviceIdRef = useRef<string | null>(null)
  // Spotify allows ONE active stream per account. If another visitor connects,
  // playback transfers to them and this device goes silent. We detect that and
  // surface a "Resume here" affordance instead of a silent stop.
  const [streamStolen, setStreamStolen] = useState(false)

  /* ---------- Fetch Spotify Token ---------- */
  async function getSpotifyToken() {
    try {
      const res = await fetch(
        "https://akqqmrqeloasisiybdjx.supabase.co/functions/v1/spotify-token"
      )
      const data = await res.json()
      const wasEmpty = !tokenRef.current
      tokenRef.current = data.access_token ?? null
      playlistUriRef.current = data.playlist_uri ?? null
      setToken(data.access_token)
      // Flip true only on the FIRST token, so the SDK effect runs once (and
      // doesn't rebuild the player on every 50-min refresh).
      if (wasEmpty && data.access_token) setTokenReady(true)
      setMode((data.mode as "personal" | "fallback") ?? "fallback")
    } catch {
      setMode("fallback")
    }
  }

  useEffect(() => {
    getSpotifyToken()
    // Refresh before the 60-min token lifetime is up. The new token lands in
    // tokenRef so the running SDK picks it up the next time it asks for one
    // (on its own expiry) — playback never drops for an open tab.
    const id = setInterval(getSpotifyToken, 50 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  /* ---------- Unlock audio on first click ---------- */
  useEffect(() => {
    const unlockAudio = () => {
      try {
        // Personal mode: the Web Playback SDK requires a user gesture to
        // activate its <audio> element before it can produce sound (autoplay).
        player?.activateElement?.()
        if (!audio) {
          const a = new Audio()
          a.muted = true
          a.play().then(() => {
            a.pause()
            setAudio(a)
          })
        } else {
          audio.play().catch(() => {})
        }
      } catch {}
    }
    window.addEventListener("click", unlockAudio, { once: true })
    return () => window.removeEventListener("click", unlockAudio)
  }, [audio, player])

  /* ---------- Clean up SDK when switching ---------- */
  useEffect(() => {
    if (mode === "fallback" && player) {
      player.disconnect?.()
      setPlayer(null)
    }
  }, [mode])

  /* ---------- Spotify Web Playback SDK ---------- */
  // Runs ONCE per personal session (gated on the first token via `tokenReady`),
  // NOT on every token refresh — so the player is built a single time and the
  // music isn't interrupted. The SDK pulls a fresh token from `tokenRef` each
  // time it (re)authenticates, which is how playback survives token expiry.
  useEffect(() => {
    if (!tokenReady || mode !== "personal") return

    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)

    let _player: any
    window.onSpotifyWebPlaybackSDKReady = () => {
      setReconnecting(true)
      _player = new window.Spotify.Player({
        name: "jeffOS iTunes",
        // Always serve the LATEST token (from the ref), not a stale closure —
        // the SDK calls this again whenever its token expires.
        getOAuthToken: (cb: (t: string) => void) => cb(tokenRef.current ?? ""),
        volume: 0.6,
      })

      _player.addListener("ready", ({ device_id }: any) => {
        deviceIdRef.current = device_id
        setTimeout(() => {
          const uri = playlistUriRef.current
          if (uri && tokenRef.current) startPlayback(device_id, tokenRef.current, uri)
          setReconnecting(false)
        }, 800)
      })

      _player.addListener("player_state_changed", (state: any) => {
        // state === null means this device is no longer the active one — i.e.
        // another visitor connected and took the single allowed stream.
        if (!state) {
          setIsPlaying(false)
          setStreamStolen(true)
          return
        }
        setStreamStolen(false)
        const current = state.track_window.current_track
        setCurrentTrack(current)
        setIsPlaying(!state.paused)
        setProgress(state.position)
        setDuration(state.duration)
      })

      // Spotify fires authentication_error when a token is rejected. Refetch a
      // fresh one into the ref so the SDK's next getOAuthToken call recovers.
      _player.addListener("authentication_error", () => {
        getSpotifyToken()
      })

      // account_error / playback_error usually mean the stream moved off this
      // device (or a non-Premium account). Surface the "Resume here" state.
      _player.addListener("account_error", () => setStreamStolen(true))
      _player.addListener("playback_error", () => setStreamStolen(true))

      _player.addListener("not_ready", () => setReconnecting(true))
      _player.connect()
      setPlayer(_player)
    }

    return () => {
      _player?.disconnect()
      script.remove()
    }
  }, [tokenReady, mode])

  async function startPlayback(deviceId: string, token: string, playlistUri: string) {
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ context_uri: playlistUri }),
      })
      setStreamStolen(false)
    } catch {}
  }

  /* ---------- Spotify Web API control (device-targeted) ----------
   * The SDK's local player.nextTrack()/previousTrack() only work when THIS
   * device currently holds the active playback context — which races with
   * transfer and silently no-ops. Driving the REST endpoints against our own
   * device_id is reliable: Spotify routes the command to the device we name.
   */
  async function spotifyControl(
    path: string,
    method: "POST" | "PUT",
    body?: object
  ): Promise<Response | null> {
    const token = tokenRef.current
    const deviceId = deviceIdRef.current
    if (!token || !deviceId) return null
    try {
      const url = `https://api.spotify.com/v1/me/player/${path}${
        path.includes("?") ? "&" : "?"
      }device_id=${deviceId}`
      return await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch {
      return null
    }
  }

  // Re-claim the active stream onto THIS device (used by Next/Prev and the
  // "Resume here" button when another visitor stole playback).
  async function transferToThisDevice(play = true) {
    const token = tokenRef.current
    const deviceId = deviceIdRef.current
    if (!token || !deviceId) return
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: [deviceId], play }),
      })
      setStreamStolen(false)
    } catch {}
  }

  // Skip helper: try the command first (fast path when this device is already
  // active). Only if it fails (stream is elsewhere) do we transfer here and
  // retry — avoiding a needless restart in the common case.
  async function skip(direction: "next" | "previous") {
    const r = await spotifyControl(direction, "POST")
    if (!r || !r.ok) {
      await transferToThisDevice(true)
      await spotifyControl(direction, "POST")
    }
  }

  const nextTrack = () => skip("next")
  const prevTrack = () => skip("previous")

  async function togglePersonalPlay() {
    // Prefer the SDK toggle (instant), but if the stream was stolen, reclaim it.
    if (streamStolen) {
      await transferToThisDevice(true)
      return
    }
    player?.togglePlay?.()
  }

  // Play a SPECIFIC track from the playlist on this device, keeping the playlist
  // as the context so Next/Prev continue to walk the list. Falls back to playing
  // by track URI if the track isn't in the current playlist context.
  async function playTrack(track: any) {
    const token = tokenRef.current
    const deviceId = deviceIdRef.current
    const uri: string | undefined = track?.uri || (track?.id && `spotify:track:${track.id}`)
    if (!token || !deviceId || !uri) {
      // No device yet (SDK not ready) — let the SDK auto-start the playlist.
      return
    }
    try {
      const ctx = playlistUriRef.current
      const body = ctx
        ? { context_uri: ctx, offset: { uri } } // keep playlist context for next/prev
        : { uris: [uri] }
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      setStreamStolen(false)
    } catch {
      /* ignore */
    }
  }

  /* ---------- Web API 30s Preview ---------- */
  function playPreview(track: any) {
    if (!track?.preview_url) {
      setAlert("🚫 No preview available for this track.")
      setTimeout(() => setAlert(null), 2000)
      return
    }

    let a = audio
    if (!a) {
      a = new Audio()
      a.crossOrigin = "anonymous"
      setAudio(a)
    }

    a.pause()
    a.src = track.preview_url
    a.currentTime = 0
    a.volume = 0

    a.oncanplaythrough = () => {
      const playPromise = a.play()
      if (playPromise) {
        playPromise
          .then(() => {
            fadeIn(a!)
            setIsPlaying(true)
            setDuration(30_000)
            setProgress(0)
            const start = Date.now()
            const tick = setInterval(() => {
              const elapsed = Date.now() - start
              setProgress(Math.min(elapsed, 30_000))
              if (elapsed >= 30_000) {
                clearInterval(tick)
                fadeOut(a!)
              }
            }, 400)
          })
          .catch(() => {
            setAlert("🔈 Tap to enable audio playback.")
            setTimeout(() => setAlert(null), 2000)
          })
      }
    }

    a.onerror = () => {
      setAlert("⚠️ Preview load error.")
      setTimeout(() => setAlert(null), 2000)
    }

    a.load()
  }

  function fadeIn(a: HTMLAudioElement) {
    const step = setInterval(() => {
      if (a.volume < 0.8) a.volume = Math.min(a.volume + 0.08, 0.8)
      else clearInterval(step)
    }, 100)
  }

  function fadeOut(a: HTMLAudioElement) {
    const step = setInterval(() => {
      if (a.volume > 0.05) a.volume -= 0.05
      else {
        clearInterval(step)
        a.pause()
        setIsPlaying(false)
      }
    }, 80)
  }

  const readOnly = mode === "fallback"

  return (
    <div
      className="
        relative flex flex-col w-full h-full
        bg-gradient-to-br from-[#e9e9e9] to-[#b9b9b9]
        dark:from-[#181818] dark:to-[#0c0c0c]
        text-neutral-900 dark:text-neutral-100
        font-[system-ui] select-none overflow-hidden
        backdrop-blur-md shadow-inner
      "
    >
      <Toolbar />

      {/* Alerts */}
      <AnimatePresence>
        {alert && (
          <motion.div
            key="alert"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-b from-[#fffbe6] to-[#f5e9b0] text-[#5b4800]
                       text-[12px] text-center py-[4px] border-b border-yellow-300 shadow-sm"
          >
            {alert}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden border-t border-neutral-400/30 dark:border-neutral-700/50">
        {/* The LIBRARY/PLAYLISTS sidebar is secondary nav; on a phone it ate
            ~half the width and squeezed the track list. Hide it on mobile and
            give the full width to the track table (UX_AUDIT_JEFFOS_APPS). */}
        {!isMobile && <Sidebar />}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {mode === "loading" ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TrackTable
              token={token ?? ""}
              onSelectTrack={(track) => {
                setCurrentTrack(track)
                if (mode === "fallback") playPreview(track)
                else playTrack(track)
              }}
            />
          )}
        </div>
      </div>

      {/* Stream-stolen banner: another visitor took the single allowed stream.
          Spotify permits one active stream per account, so we offer to reclaim
          it here rather than dying silently. */}
      <AnimatePresence>
        {streamStolen && mode === "personal" && (
          <motion.button
            key="resume"
            onClick={() => transferToThisDevice(true)}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="mx-3 mb-1 rounded-md bg-[#1f8aff] px-3 py-2 text-[12px] font-medium text-white shadow hover:bg-[#1577e0]"
          >
            🎧 Playing on another device — tap to resume here
          </motion.button>
        )}
      </AnimatePresence>

      {/* Player */}
      <div className={readOnly ? "pointer-events-none opacity-60" : ""}>
        <PlayerBar
          track={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          onPlayPause={() =>
            mode === "fallback" && audio
              ? audio.paused
                ? audio.play()
                : audio.pause()
              : togglePersonalPlay()
          }
          onNext={() => mode === "personal" && nextTrack()}
          onPrev={() => mode === "personal" && prevTrack()}
        />
      </div>

      {/* Subtle reconnect spinner */}
      <AnimatePresence>
        {reconnecting && mode === "personal" && (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="
              absolute inset-0 flex items-center justify-center 
              backdrop-blur-[2px] bg-white/10 dark:bg-black/20 z-40
            "
          >
            <div className="w-5 h-5 border-2 border-neutral-400/70 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
