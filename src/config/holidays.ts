import { supabase } from "../lib/supabase"

/* -------------------------------------------------------------------------- */
/* 🧠 Types                                                                   */
/* -------------------------------------------------------------------------- */

export type HolidayId =
  | "new_year"
  | "valentines"
  | "halloween"
  | "thanksgiving_us"
  | "christmas"
  | "cny"
  | "eid"
  | "nigeria_independence"

export interface Holiday {
  id: HolidayId
  name: string
  start: Date
  end: Date
  themeId: string
}

/* -------------------------------------------------------------------------- */
/* 🧮 Movable Holiday Calculations (local fallback)                            */
/* -------------------------------------------------------------------------- */

function thanksgivingDate(year: number): Date {
  const nov1 = new Date(year, 10, 1)
  const day = nov1.getDay()
  const firstThu = 1 + ((4 - day + 7) % 7)
  return new Date(year, 10, firstThu + 21)
}

const CNY_TABLE: Record<number, string> = {
  2025: "2025-01-29",
  2026: "2026-02-17",
  2027: "2027-02-06",
  2028: "2028-01-26",
  2029: "2029-02-13",
  2030: "2030-02-03",
}
const EID_TABLE: Record<number, string> = {
  2025: "2025-03-31",
  2026: "2026-03-21",
  2027: "2027-03-10",
  2028: "2028-02-27",
  2029: "2029-02-15",
  2030: "2030-02-05",
}
const chineseNewYearDate = (y: number) => (CNY_TABLE[y] ? new Date(CNY_TABLE[y]) : null)
const eidDate = (y: number) => (EID_TABLE[y] ? new Date(EID_TABLE[y]) : null)

function between(s: Date, e: Date, d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return x >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
         x <= new Date(e.getFullYear(), e.getMonth(), e.getDate())
}

/* -------------------------------------------------------------------------- */
/* 🏠 Local Fallback Holidays (static rules)                                   */
/* -------------------------------------------------------------------------- */
export function getLocalActiveHoliday(date = new Date()): Holiday | null {
  const y = date.getFullYear()
  const list: Holiday[] = [
    {
      id: "new_year",
      name: "New Year",
      start: new Date(y, 0, 1),
      end: new Date(y, 0, 3),
      themeId: "theme_new_year",
    },
    {
      id: "valentines",
      name: "Valentine’s Day",
      start: new Date(y, 1, 14),
      end: new Date(y, 1, 14),
      themeId: "theme_valentines",
    },
    {
      id: "halloween",
      name: "Halloween",
      start: new Date(y, 9, 31),
      end: new Date(y, 9, 31),
      themeId: "theme_halloween",
    },
    {
      id: "thanksgiving_us",
      name: "Thanksgiving (US)",
      start: thanksgivingDate(y),
      end: thanksgivingDate(y),
      themeId: "theme_thanksgiving",
    },
    {
      id: "christmas",
      name: "Christmas",
      start: new Date(y, 11, 20),
      end: new Date(y, 11, 27),
      themeId: "theme_christmas",
    },
    {
      id: "cny",
      name: "Chinese New Year",
      start: (() => {
        const cny = chineseNewYearDate(y)
        return cny ? new Date(cny.getUTCFullYear(), cny.getUTCMonth(), cny.getUTCDate() - 1) : new Date()
      })(),
      end: (() => {
        const cny = chineseNewYearDate(y)
        return cny ? new Date(cny.getUTCFullYear(), cny.getUTCMonth(), cny.getUTCDate() + 1) : new Date()
      })(),
      themeId: "theme_cny",
    },
    {
      id: "eid",
      name: "Eid al-Fitr",
      start: (() => {
        const eid = eidDate(y)
        return eid ? new Date(eid.getUTCFullYear(), eid.getUTCMonth(), eid.getUTCDate() - 1) : new Date()
      })(),
      end: (() => {
        const eid = eidDate(y)
        return eid ? new Date(eid.getUTCFullYear(), eid.getUTCMonth(), eid.getUTCDate() + 1) : new Date()
      })(),
      themeId: "theme_eid",
    },
    {
      id: "nigeria_independence",
      name: "Nigeria Independence Day",
      start: new Date(y, 9, 1),
      end: new Date(y, 9, 1),
      themeId: "theme_nigeria_independence",
    },
  ]

  return list.find((h) => between(h.start, h.end, date)) ?? null
}

/* -------------------------------------------------------------------------- */
/* ☁️ Dynamic Supabase Holiday Lookup                                         */
/* -------------------------------------------------------------------------- */
export async function getActiveHoliday(date = new Date()): Promise<Holiday | null> {
  try {
    const today = date.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from("calendar_holidays")
      .select("*")

    if (error) throw error

    const y = date.getFullYear()
    for (const h of data ?? []) {
      const [type, rule] = h.rule.split(":")
      let start: Date | null = null
      let end: Date | null = null

      if (type === "fixed") {
        const [m, d] = rule.split("-").map(Number)
        start = end = new Date(y, m - 1, d)
      } else if (type === "range") {
        const [s, e] = rule.split(",")
        const [m1, d1] = s.split("-").map(Number)
        const [m2, d2] = e.split("-").map(Number)
        start = new Date(y, m1 - 1, d1)
        end = new Date(y, m2 - 1, d2)
      } else if (type === "thanksgiving") {
        start = end = thanksgivingDate(y)
      } else if (type === "eid") {
        const eid = eidDate(y)
        if (eid) start = end = eid
      } else if (type === "cny") {
        const cny = chineseNewYearDate(y)
        if (cny) start = end = cny
      }

      if (start && end && between(start, end, date)) {
        return {
          id: h.name.toLowerCase().replace(/\s+/g, "_") as HolidayId,
          name: h.name,
          start,
          end,
          themeId: h.theme_id,
        }
      }
    }

    return getLocalActiveHoliday(date)
  } catch (err) {
    console.warn("⚠️ Supabase holiday lookup failed, fallback to local:", err)
    return getLocalActiveHoliday(date)
  }
}

/* -------------------------------------------------------------------------- */
/* 🎨 Theme ID Type                                                           */
/* -------------------------------------------------------------------------- */
export type ThemeId =
  | "theme_new_year"
  | "theme_valentines"
  | "theme_halloween"
  | "theme_thanksgiving"
  | "theme_christmas"
  | "theme_cny"
  | "theme_eid"
  | "theme_nigeria_independence"
