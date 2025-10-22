import type { StateCreator } from "zustand";
import type { AppId } from "./apps";  // your AppId union

export type WindowState = {
  id: string;
  appKey: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zoomed: boolean;
  lastBounds?: { x: number; y: number; width: number; height: number };
  minimizing?: boolean; // 👈 transient flag for genie animation
  props?: Record<string, unknown>; // 👈 NEW optional launch props
};

export interface UiSlice {
  windows: Record<string, WindowState>;
  focusStack: string[];
  dockIconPositions: Record<string, { x: number; y: number }>;

  dock: { appKey: AppId; winId: string }[];

  openWindow: (win: WindowState) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  zoomWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  focusWindow: (id: string) => void;
  setDockIconPosition: (id: string, pos: { x: number; y: number }) => void;
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set, get) => ({
  windows: {},
  focusStack: [],
  dockIconPositions: {},
  dock: [],

  openWindow: (win) =>
    set((state) => ({
      windows: {
        ...state.windows,
        [win.id]: { ...win, minimizing: false }, // reset flag
      },
      focusStack: [...state.focusStack.filter((i) => i !== win.id), win.id],
      dock: state.dock.filter((d) => d.winId !== win.id),
    })),

  closeWindow: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.windows;
      return {
        windows: rest,
        focusStack: state.focusStack.filter((i) => i !== id),
        dock: state.dock.filter((d) => d.winId !== id),
      };
    }),

  minimizeWindow: (id) => {
    const win = get().windows[id];
    if (!win) return;

    // Step 1: trigger genie animation
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: { ...win, minimizing: true },
      },
    }));

    // Step 2: after animation, mark as minimized & docked
    setTimeout(() => {
      set((state) => {
        const w = state.windows[id];
        if (!w) return state;
        return {
          windows: {
            ...state.windows,
            [id]: { ...w, minimized: true, minimizing: false },
          },
          dock: [
            ...state.dock.filter((d) => d.winId !== id),
            { appKey: w.appKey, winId: id },
          ],
        };
      });
    }, 500); // should match genie animation duration
  },

  restoreWindow: (id) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      return {
        windows: {
          ...state.windows,
          [id]: { ...w, minimized: false, minimizing: false },
        },
        focusStack: [...state.focusStack.filter((i) => i !== id), id],
        dock: state.dock.filter((d) => d.winId !== id),
      };
    }),

  zoomWindow: (id) => {
    const win = get().windows[id];
    if (!win) return;

    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 720;

    const MENU_BAR = 24;
    const DOCK_SPACE = 100;

    if (!win.zoomed) {
      const bounds = { x: win.x, y: win.y, width: win.width, height: win.height };
      const width = Math.max(320, vw);
      const height = Math.max(200, vh - MENU_BAR - DOCK_SPACE);
      const x = Math.max(0, Math.floor((vw - width) / 2));
      const y = MENU_BAR;

      set((state) => ({
        windows: {
          ...state.windows,
          [id]: { ...win, lastBounds: bounds, x, y, width, height, zoomed: true },
        },
      }));
    } else {
      if (win.lastBounds) {
        set((state) => ({
          windows: { ...state.windows, [id]: { ...win, ...win.lastBounds, zoomed: false } },
        }));
      } else {
        set((state) => ({
          windows: { ...state.windows, [id]: { ...win, zoomed: false } },
        }));
      }
    }
  },

  moveWindow: (id, x, y) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      return { windows: { ...state.windows, [id]: { ...w, x, y } } };
    }),

  focusWindow: (id) =>
    set((state) => {
      if (!state.windows[id]) return state;
      return { focusStack: [...state.focusStack.filter((i) => i !== id), id] };
    }),

  setDockIconPosition: (id, pos) =>
    set((state) => ({
      dockIconPositions: { ...state.dockIconPositions, [id]: pos },
    })),
});
