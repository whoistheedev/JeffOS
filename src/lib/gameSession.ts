import { supabase } from "./supabase"

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string

/**
 * Record a "play" when a game launches (calls the game-start edge function,
 * which inserts a game_sessions row). EmulatorJS can't report scores, so the
 * honest leaderboard is "most played" — see GAME_SCOREBOARD_SCALABILITY_AUDIT.
 *
 * Fire-and-forget + best-effort: a failure never blocks gameplay.
 */
export function recordGamePlay(anonId: string, gameId: string): void {
  if (!anonId || !gameId) return
  void fetch(`${FN_BASE}/game-start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ anonId, gameId }),
  }).catch(() => {
    /* best-effort — never disrupt play */
  })
}

export type MostPlayed = { game_id: string; plays: number }

/** Read the "most played" board (top N) via the get_most_played RPC. */
export async function fetchMostPlayed(limit = 20): Promise<MostPlayed[]> {
  const { data, error } = await supabase.rpc("get_most_played", { limit_n: limit })
  if (error || !data) return []
  return data as MostPlayed[]
}
