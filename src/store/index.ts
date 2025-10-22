// src/store/index.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { useShallow } from "zustand/react/shallow";

import type { UiSlice } from "./ui";
import { createUiSlice } from "./ui";
import type { PrefsSlice } from "./prefs";
import { createPrefsSlice } from "./prefs";
import type { AppsSlice } from "./apps";
import { createAppsSlice } from "./apps";
import type { GamesSlice } from "./games";
import { createGamesSlice } from "./games";
import type { MetricsSlice } from "./metrics";
import { createMetricsSlice } from "./metrics";

// Debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 200) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Combined store type
export type StoreState = UiSlice & PrefsSlice & AppsSlice & GamesSlice & MetricsSlice;

const LOCAL_STORAGE_KEY = "whoisthedev-root";

const useBoundStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createUiSlice(...a),
      ...createPrefsSlice(...a),
      ...createAppsSlice(...a),
      ...createGamesSlice(...a),
      ...createMetricsSlice(...a),
    }),
    {
      name: LOCAL_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) =>
        ({
          // Anonymous IDs
          anonId: s.anonId,
          anonIdOld: (s as any).anonIdOld,
          anoId: (s as any).anoId,

          // UI slice
          
          windows: s.windows,

          // Prefs slice
          prefs: s.prefs,

          // Apps slice
          apps: s.apps,

          // Games slice
          sessions: s.sessions,
          leaderboards: s.leaderboards,

          // Metrics slice
          metrics: s.metrics,
        }) as Partial<StoreState>,
      // Debounced storage writes
      onRehydrateStorage: () => (state) => {
        const save = debounce(() => {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        }, 200);
        return save;
      },
    }
  )
);

/**
 * Primary hook — full zustand API
 */
export const useStore = useBoundStore;

/**
 * Convenience re-exports
 */
export { shallow, useShallow };

// Direct API access
export const storeApi = useBoundStore;
