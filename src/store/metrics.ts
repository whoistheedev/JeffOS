// src/store/metrics.ts
import type { StateCreator } from "zustand"

export interface MetricsSlice {
  metrics: {
    onlineNow: number
  }
  setOnlineNow: (n: number) => void
}

export const createMetricsSlice: StateCreator<MetricsSlice> = (set) => ({
  metrics: {
    onlineNow: 0,
  },
  setOnlineNow: (n) =>
    set((state) => ({
      metrics: { ...state.metrics, onlineNow: n },
    })),
})
