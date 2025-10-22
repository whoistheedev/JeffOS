import { useEffect, useState } from "react"

export function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const update = () => setNow(new Date())

    const start = () => {
      if (!timer) {
        update()
        timer = setInterval(update, 30_000)
      }
    }
    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    start()
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop()
      else start()
    })
    return () => stop()
  }, [])

  const label = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now)

  return { now, label }
}
