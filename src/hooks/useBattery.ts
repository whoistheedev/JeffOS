// src/hooks/useBattery.ts
import { useEffect, useState } from "react"

interface BatteryState {
  charging: boolean
  level: number
  dischargingTime?: number
  chargingTime?: number
}

export function useBattery() {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [battery, setBattery] = useState<BatteryState | null>(null)

  useEffect(() => {
    let batt: any
    if (!("getBattery" in navigator)) {
      setSupported(false)
      return
    }
    ;(navigator as any)
      .getBattery()
      .then((b: any) => {
        batt = b
        setSupported(true)
        const update = () =>
          setBattery({
            charging: b.charging,
            level: b.level,
            dischargingTime: b.dischargingTime,
            chargingTime: b.chargingTime,
          })
        update()
        b.addEventListener("levelchange", update)
        b.addEventListener("chargingchange", update)
        b.addEventListener("dischargingtimechange", update)
        b.addEventListener("chargingtimechange", update)
      })
      .catch(() => {
        setSupported(false)
      })

    return () => {
      if (batt) {
        batt.removeEventListener("levelchange", () => {})
        batt.removeEventListener("chargingchange", () => {})
        batt.removeEventListener("dischargingtimechange", () => {})
        batt.removeEventListener("chargingtimechange", () => {})
      }
    }
  }, [])

  return { supported, battery }
}
