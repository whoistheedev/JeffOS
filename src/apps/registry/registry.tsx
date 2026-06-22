import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { AppId } from "../../store/apps";

/**
 * ⚡ Code-split app loading.
 *
 * Each app is loaded with React.lazy(() => import(...)) so it becomes its own
 * Rollup chunk and is fetched on demand the first time a window for it opens.
 * Heavy apps (Games/EmulatorJS, Synth audio graph, Explorer, Terminal, iTunes)
 * are therefore NEVER part of the initial bundle.
 *
 * The public shape of AppRegistry is unchanged: consumers still read
 * `AppRegistry[appKey].component` / `.resizable` / `.expandToFit`.
 * `component` is now a LazyExoticComponent (still a valid ComponentType), so it
 * must be rendered inside a <Suspense> boundary — see Window.tsx.
 */
const Wallpapers = lazy(() => import("../wallpapers/WallpapersApp"));
const Games = lazy(() => import("../games/EmulatorApp"));
const Guestbook = lazy(() => import("../guestbook/Guestbook"));
const Piano = lazy(() => import("../synth/Synth"));
const Explorer = lazy(() => import("../browser/Explorer"));
const Finder = lazy(() => import("../finder/Finder"));
const Ipod = lazy(() => import("../music/iTunesApp"));
const Terminal = lazy(() => import("../terminal/Terminal"));
const Calendar = lazy(() => import("../calendar/HolidayCalendar"));
const BuyMeCoffee = lazy(() => import("../bmcoffee/BuyMeCoffee"));

export type AppMeta = {
  component: ComponentType | LazyExoticComponent<ComponentType>; // 👈 lazy-loaded component
  resizable: boolean;      // 👈 can resize window
  expandToFit: boolean;    // 👈 should app content stretch to fill window?
  title: string;           // 👈 Tiger-correct window/title-bar display name (e.g. "Finder", not "finder")
};

// Registry maps AppId -> Component + meta
// `title` is the human-readable window title shown in the title bar. Without it,
// windows fell back to the lowercase app id ("finder") — a small authenticity
// tell. Real Tiger titles are capitalized app names (TIGER_AUTHENTICITY_REVIEW §4).
export const AppRegistry: Partial<Record<AppId, AppMeta>> = {
  wallpapers:   { component: Wallpapers,  resizable: true,  expandToFit: true, title: "Desktop & Screen Saver" },  // 📄 fixed
  games:        { component: Games,       resizable: true,  expandToFit: true, title: "Games" },
  guestbook:    { component: Guestbook,   resizable: true,  expandToFit: true, title: "Guestbook" },
  synth:        { component: Piano,       resizable: false, expandToFit: true, title: "Synth" },   // 🎹 fixed
  explorer:     { component: Explorer,    resizable: true,  expandToFit: true, title: "Safari" },
  finder:       { component: Finder,      resizable: true,  expandToFit: true, title: "Finder" },

  itunes:       { component: Ipod,        resizable: false, expandToFit: true, title: "iTunes" },   // 🎵 fixed
  terminal:     { component: Terminal,    resizable: true,  expandToFit: true, title: "Terminal" },
  calendar:     { component: Calendar,    resizable: true,  expandToFit: true, title: "iCal" },
  bmcoffee:     { component: BuyMeCoffee, resizable: true,  expandToFit: true, title: "Buy Me a Coffee" },

};
