import React, { useEffect, useState } from "react"
import { Sidebar } from "./components/Sidebar"
import { Toolbar } from "./components/Toolbar"
import { TrackTable } from "./components/TrackTable"
import { PlayerBar } from "./components/PlayerBar"
import { motion, AnimatePresence } from "framer-motion"

declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export default function iTunesApp() {
  const [currentTrack, setCurrentTrack] = useState<any | null>(null)
  const [player, setPlayer] = useState<any | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [playlistUri, setPlaylistUri] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [mode, setMode] = useState<"personal" | "fallback" | "loading">("loading")
  const [reconnecting, setReconnecting] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [alert, setAlert] = useState<string | null>(null)

  /* ---------- Fetch Spotify Token ---------- */
  async function getSpotifyToken() {
    try {
      const res = await fetch(
        "https://akqqmrqeloasisiybdjx.supabase.co/functions/v1/spotify-token"
      )
      const data = await res.json()
      setToken(data.access_token)
      setPlaylistUri(data.playlist_uri)
      setMode((data.mode as "personal" | "fallback") ?? "fallback")
    } catch {
      setMode("fallback")
    }
  }

  useEffect(() => {
    getSpotifyToken()
    const id = setInterval(getSpotifyToken, 55 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  /* ---------- Unlock audio on first click ---------- */
  useEffect(() => {
    const unlockAudio = () => {
      try {
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
  }, [audio])

  /* ---------- Clean up SDK when switching ---------- */
  useEffect(() => {
    if (mode === "fallback" && player) {
      player.disconnect?.()
      setPlayer(null)
    }
  }, [mode])

  /* ---------- Spotify Web Playback SDK ---------- */
  useEffect(() => {
    if (!token || mode !== "personal") return

    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)

    let _player: any
    window.onSpotifyWebPlaybackSDKReady = () => {
      setReconnecting(true)
      _player = new window.Spotify.Player({
        name: "jeffOS iTunes",
        getOAuthToken: (cb: (t: string) => void) => cb(token),
        volume: 0.6,
      })

      _player.addListener("ready", ({ device_id }: any) => {
        setTimeout(() => {
          if (playlistUri) startPlayback(device_id, token, playlistUri)
          setReconnecting(false)
        }, 800)
      })

      _player.addListener("player_state_changed", (state: any) => {
        if (!state) return
        const current = state.track_window.current_track
        setCurrentTrack(current)
        setIsPlaying(!state.paused)
        setProgress(state.position)
        setDuration(state.duration)
      })

      _player.addListener("not_ready", () => setReconnecting(true))
      _player.connect()
      setPlayer(_player)
    }

    return () => {
      _player?.disconnect()
      document.body.removeChild(script)
    }
  }, [token, playlistUri, mode])

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
    } catch {}
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
        <Sidebar />
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
                else player?.togglePlay?.()
              }}
            />
          )}
        </div>
      </div>

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
              : player?.togglePlay?.()
          }
          onNext={() => mode === "personal" && player?.nextTrack()}
          onPrev={() => mode === "personal" && player?.previousTrack()}
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
