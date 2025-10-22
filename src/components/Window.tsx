import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
  type TargetAndTransition,
  easeIn,
} from "framer-motion";
import { useStore, storeApi } from "../store";
import { AppRegistry } from "../apps/registry/registry";
import AboutWindow from "./AboutWindow";
import AboutAppWindow from "./AboutAppWindow";
import { playSystemSound } from "../store/sounds";

type Props = {
  id: string;
  title?: string;
};

const DEFAULT_SIZE = { width: 640, height: 420 };

// Store per-app memory
const windowMemory: Record<
  string,
  { x: number; y: number; width: number; height: number }
> = {};

export default function Window({ id, title }: Props) {
  const win = useStore((s) => s.windows[id]);
  const closeWindow = useStore((s) => s.closeWindow);
  const minimizeWindow = useStore((s) => s.minimizeWindow);
  const zoomWindow = useStore((s) => s.zoomWindow);
  const moveWindow = useStore((s) => s.moveWindow);
  const focusWindow = useStore((s) => s.focusWindow);
  const focusStack = useStore((s) => s.focusStack);
  const dockPos = useStore((s) => s.dockIconPositions[win?.appKey || ""]);

  const [hasBeenAutoSized, setHasBeenAutoSized] = useState(false);
  if (!win) return null;

  // Handle special About modals
  if ((win.appKey as string) === "about") return <AboutWindow id={id} />;
  if ((win.appKey as string) === "about-app") return <AboutAppWindow id={id} />;

  // Registry
  const appMeta = AppRegistry[win.appKey as keyof typeof AppRegistry] ?? null;
  const AppComponent = appMeta ? appMeta.component : null;
  const isResizable = appMeta ? appMeta.resizable : true;

  const prefersReducedMotion = useReducedMotion();
  const isActive = focusStack[focusStack.length - 1] === id;

  // Responsive sizing logic
  useEffect(() => {
    if (hasBeenAutoSized) return;
    const remembered = windowMemory[win.appKey];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // adaptive default for smaller devices
    const baseWidth = Math.min(DEFAULT_SIZE.width, vw * 0.9);
    const baseHeight = Math.min(DEFAULT_SIZE.height, vh * 0.75);

    let width = baseWidth;
    let height = baseHeight;
    let x = Math.max(10, Math.floor((vw - width) / 2));
    let y = Math.max(20, Math.floor((vh - height) / 2));

    if (remembered) {
      ({ x, y, width, height } = remembered);
    }

    storeApi.setState((state) => ({
      windows: {
        ...state.windows,
        [id]: { ...state.windows[id], x, y, width, height },
      },
    }));
    setHasBeenAutoSized(true);
    playSystemSound("open");
  }, [id, win.appKey, hasBeenAutoSized]);

  const saveMemory = (data: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    windowMemory[win.appKey] = data;
  };

  // Keyboard shortcuts (Mac style)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const stack = storeApi.getState().focusStack;
      const top = stack[stack.length - 1];
      if (top !== id) return;

      const key = e.key.toLowerCase();
      if (e.metaKey && key === "w") {
        playSystemSound("close");
        closeWindow(id);
      }
      if (e.metaKey && key === "m") {
        playSystemSound("minimize");
        storeApi.setState((s) => ({
          windows: { ...s.windows, [id]: { ...s.windows[id], minimizing: true } },
        }));
        minimizeWindow(id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [id, closeWindow, minimizeWindow]);

  // Responsive adjustment on viewport resize/rotation
  useEffect(() => {
    const handleResize = () => {
      const current = storeApi.getState().windows[id];
      if (!current) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const newWidth = Math.min(current.width, vw * 0.95);
      const newHeight = Math.min(current.height, vh * 0.9);
      const newX = Math.min(Math.max(0, current.x), vw - newWidth);
      const newY = Math.min(Math.max(0, current.y), vh - newHeight);

      storeApi.setState((state) => ({
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], x: newX, y: newY, width: newWidth, height: newHeight },
        },
      }));
      saveMemory({ x: newX, y: newY, width: newWidth, height: newHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [id]);

  const zIndex = useMemo(() => {
    const idx = focusStack.indexOf(id);
    return 100 + (idx >= 0 ? idx : 0);
  }, [focusStack, id]);

  const visibleVariant: TargetAndTransition = {
    opacity: 1,
    scale: 1,
    transition: { duration: prefersReducedMotion ? 0 : 0.25, ease: easeIn },
  };
  const hiddenVariant: TargetAndTransition = {
    opacity: 0,
    scale: 0.9,
    y: 60,
    transition: { duration: 0.2, ease: easeIn },
  };
  const genieVariant: TargetAndTransition = {
    opacity: 0,
    scaleY: 0.1,
    scaleX: 0.5,
    x: (dockPos?.x ?? 0) - (win.x + win.width / 2),
    y: (dockPos?.y ?? 0) - (win.y + win.height),
    transition: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
  };

  const variants: Variants = {
    visible: visibleVariant,
    hidden: hiddenVariant,
    genie: genieVariant,
  };

  const getTrafficLightStyle = (
    type: "close" | "minimize" | "zoom",
    active: boolean
  ) => {
    const base = "w-3.5 h-3.5 rounded-full touch-manipulation";
    if (!active) {
      return {
        className: base,
        style: {
          background: `radial-gradient(circle at 30% 30%, #888, #555 80%)`,
          boxShadow: `inset 0 1px rgba(255,255,255,0.5),
                      inset 0 -1px rgba(0,0,0,0.7),
                      0 1px 2px rgba(0,0,0,0.7)`,
          border: "1px solid rgba(0,0,0,0.6)",
        },
      };
    }
    let colorStops = "";
    if (type === "close") colorStops = "radial-gradient(circle at 30% 30%, #ffb3ad, #e53935 70%)";
    if (type === "minimize") colorStops = "radial-gradient(circle at 30% 30%, #fff9c4, #fbc02d 70%)";
    if (type === "zoom") colorStops = "radial-gradient(circle at 30% 30%, #a5d6a7, #388e3c 70%)";

    return {
      className: base,
      style: {
        backgroundImage: `
          ${colorStops},
          radial-gradient(circle at 70% 30%, rgba(255,255,255,0.8) 0%, transparent 40%),
          radial-gradient(circle at 50% 80%, rgba(0,0,0,0.3), transparent 60%)
        `,
        boxShadow: `inset 0 1px rgba(255,255,255,0.8),
                    inset 0 -1px rgba(0,0,0,0.6),
                    0 1px 2px rgba(0,0,0,0.6)`,
        border: "1px solid rgba(0,0,0,0.4)",
      },
    };
  };

  return (
    <AnimatePresence>
      {!win.minimized && (
        <motion.div
          key={id}
          initial="hidden"
          animate="visible"
          exit={win.minimizing ? "genie" : "hidden"}
          variants={variants}
          className="absolute touch-none select-none"
          style={{ zIndex }}
          onMouseDown={() => {
            focusWindow(id);
            playSystemSound("focus");
          }}
          onTouchStart={() => {
            focusWindow(id);
            playSystemSound("focus");
          }}
          onAnimationComplete={() => {
            if (win.minimizing) {
              storeApi.setState((s) => ({
                windows: {
                  ...s.windows,
                  [id]: { ...s.windows[id], minimizing: false, minimized: true },
                },
              }));
            }
          }}
        >
          <Rnd
            size={{ width: win.width, height: win.height }}
            position={{ x: win.x, y: win.y }}
            minWidth={280}
            minHeight={180}
            bounds="window"
            enableResizing={isResizable}
            dragHandleClassName="titlebar"
            disableDragging={window.innerWidth < 480} // prevent accidental drags on phones
            className={`rounded-md overflow-hidden ${
              isActive ? "shadow-xl" : "shadow"
            }`}
            style={{
              backgroundImage: `
                linear-gradient(to bottom, #f4f4f4, #b0b0b0),
                repeating-linear-gradient(
                  90deg,
                  rgba(255,255,255,0.25) 0px,
                  rgba(0,0,0,0.05) 0.5px,
                  transparent 1px
                )
              `,
              backgroundBlendMode: "overlay, overlay, normal",
              backgroundSize: "auto, 1px, 150px",
              border: isActive ? "1px solid #555" : "1px solid #777",
              touchAction: "none",
            }}
            onDrag={(_, d) => {
              useStore.setState((state) => ({
                windows: {
                  ...state.windows,
                  [id]: { ...state.windows[id], x: d.x, y: d.y },
                },
              }));
            }}
            onDragStop={(_, d) => {
              useStore.getState().moveWindow(id, d.x, d.y);
            }}
            onResize={(_, __, ref, ___, position) => {
              const newState = {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y,
              };
              useStore.setState((state) => ({
                windows: {
                  ...state.windows,
                  [id]: { ...state.windows[id], ...newState },
                },
              }));
            }}
            onResizeStop={(_, __, ref, ___, position) => {
              const newState = {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y,
              };
              useStore.getState().moveWindow(id, newState.x, newState.y);
            }}
          >
            {/* Titlebar */}
            <div
              className="titlebar flex items-center gap-2 px-3 py-1.5 cursor-grab active:cursor-grabbing"
              onDoubleClick={() => {
                playSystemSound("zoom");
                zoomWindow(id);
              }}
              style={{
                backgroundImage: `
                  linear-gradient(to bottom, #dcdcdc, #b8b8b8)
                `,
                backgroundBlendMode: "overlay, normal",
                borderBottom: "1px solid rgba(0,0,0,0.6)",
              }}
            >
              {/* Traffic Lights */}
              <div className="flex items-center gap-2">
                {(["close", "minimize", "zoom"] as const).map((type) => {
                  const { className, style } = getTrafficLightStyle(type, isActive);
                  const clickMap = {
                    close: () => {
                      playSystemSound("close");
                      closeWindow(id);
                    },
                    minimize: () => {
                      playSystemSound("minimize");
                      storeApi.setState((s) => ({
                        windows: { ...s.windows, [id]: { ...s.windows[id], minimizing: true } },
                      }));
                      minimizeWindow(id);
                    },
                    zoom: () => {
                      playSystemSound("zoom");
                      zoomWindow(id);
                    },
                  };
                  return (
                    <button
                      key={type}
                      aria-label={type}
                      className={className}
                      style={style}
                      onClick={clickMap[type]}
                    />
                  );
                })}
              </div>

              <div className="flex-1 text-center text-sm font-medium text-gray-800 truncate">
                {title ?? win.appKey}
              </div>
              <div className="w-16" />
            </div>

            {/* Content */}
            <div
              className="h-[calc(100%-32px)] overflow-auto bg-white flex items-center justify-center"
              style={{
                borderTop: "1px solid #d0d0d0",
              }}
            >
              {win.props?.component && typeof win.props.component === "function" ? (
                (() => {
                  const DynamicComp = win.props.component as ComponentType<any>;
                  return <DynamicComp />;
                })()
              ) : AppComponent ? (
                appMeta && appMeta.expandToFit ? (
                  <div className="w-full h-full">
                    <AppComponent />
                  </div>
                ) : (
                  <div className="inline-block">
                    <AppComponent />
                  </div>
                )
              ) : (
                <div className="p-4">No app found</div>
              )}
            </div>
          </Rnd>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
