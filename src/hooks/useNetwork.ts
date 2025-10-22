import { useEffect, useState } from "react"

export function useNetwork() {
  const [online, setOnline] = useState(navigator.onLine)
  const [effectiveType, setEffectiveType] = useState<string | undefined>(
    (navigator as any)?.connection?.effectiveType
  )

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const connection = (navigator as any)?.connection
    if (connection?.addEventListener) {
      const updateType = () => setEffectiveType(connection.effectiveType)
      connection.addEventListener("change", updateType)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (connection?.removeEventListener) {
        connection.removeEventListener("change", () => {})
      }
    }
  }, [])

  return { online, effectiveType }
}
