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

// Combined store type
export type StoreState = UiSlice & PrefsSlice & AppsSlice & GamesSlice & MetricsSlice;

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
      name: "whoisthedev-root",
      storage: createJSONStorage(() => localStorage),
      // Persist only anonId(s) and prefs
      partialize: (s) =>
        ({
          anonId: s.anonId,
          anonIdOld: (s as any).anonIdOld, // keep if you added it
          anoId: (s as any).anoId,         // keep if you added it
          prefs: s.prefs,
        }) as Partial<StoreState>,
    }
  )
);

/**
 * Primary hook — keep the full zustand API (getState, setState, subscribe, etc.)
 */
export const useStore = useBoundStore;

/**
 * Convenience re-exports
 */
export { shallow, useShallow };

// If you want the direct API:
export const storeApi = useBoundStore;
