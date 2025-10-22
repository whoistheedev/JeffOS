import type { ComponentType } from "react";
import type { AppId } from "../../store/apps";

// ✅ Import ONLY the apps you’ve actually built
import Wallpapers from "../wallpapers/WallpapersApp";
import Resume from "../resume/ResumeApp";
import Games from "../games/EmulatorApp";
import Guestbook from "../guestbook/Guestbook";
import Piano from "../synth/Synth";
import Explorer from "../browser/Explorer";
import Recruiter from "../recruiter/Recruiter";
import Finder from "../finder/Finder";
import ControlPanel from "../controlpanel/ControlPanel";
import Ipod from "../music/iTunesApp";
import Terminal from "../terminal/Terminal";
import Calendar from "../calendar/HolidayCalendar";
import BuyMeCoffee from "../bmcoffee/BuyMeCoffee";
import AboutThisMac from "../system/AboutThisMac";

export type AppMeta = {
  component: ComponentType;
  resizable: boolean;      // 👈 can resize window
  expandToFit: boolean;    // 👈 should app content stretch to fill window?
};

// Registry maps AppId -> Component + meta
export const AppRegistry: Partial<Record<AppId, AppMeta>> = {
  wallpapers:   { component: Wallpapers,  resizable: true,  expandToFit: true },  // 📄 fixed
  games:        { component: Games,       resizable: true,  expandToFit: true },
  guestbook:    { component: Guestbook,   resizable: true,  expandToFit: true },
  synth:        { component: Piano,       resizable: false, expandToFit: true },   // 🎹 fixed
  explorer:     { component: Explorer,    resizable: true,  expandToFit: true },
  recruiter:    { component: Recruiter,   resizable: true,  expandToFit: true },
  finder:       { component: Finder,      resizable: true,  expandToFit: true },
  
  itunes:         { component: Ipod,        resizable: false, expandToFit: true },   // 🎵 fixed
  terminal:     { component: Terminal,    resizable: true,  expandToFit: true },
  calendar:     { component: Calendar,    resizable: true,  expandToFit: true },
  bmcoffee:     { component: BuyMeCoffee, resizable: true,  expandToFit: true },

};
