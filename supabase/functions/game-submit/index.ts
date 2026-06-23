import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Public, no-login app: auth is the single-use session token from game-start
// (deployed with verify_jwt:false). See GAME_SCOREBOARD_SCALABILITY_AUDIT.md.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } })

// Coarse universal sanity bounds (C3). Per-game tuning is a P1 follow-up; even
// these kill trivial forgery (negative/overflow/insta-win scores).
const MAX_SCORE = 100_000_000
const MIN_DURATION_SEC = 2

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "method" }, 405)

  let session_id: string, token: string, score: number, duration: number
  try {
    const body = await req.json()
    session_id = String(body.session_id ?? "")
    token = String(body.token ?? "")
    score = Number(body.score)
    duration = Number(body.duration)
  } catch {
    return json({ error: "bad request" }, 400)
  }

  // C3: validate the score/duration before trusting them.
  if (!session_id || !token) return json({ error: "session required" }, 400)
  if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > MAX_SCORE)
    return json({ error: "invalid score" }, 422)
  if (!Number.isFinite(duration) || duration < MIN_DURATION_SEC)
    return json({ error: "invalid duration" }, 422)

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SERVICE_KEY")!)

  // C4: atomically consume the session — only succeeds if it exists, matches the
  // token, is unused, and unexpired. The UPDATE...returning is the single-use
  // guard: a replay finds used=true and returns no row.
  const { data: claimed, error: claimErr } = await supabase
    .from("game_sessions")
    .update({ used: true })
    .eq("session_id", session_id)
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .select("anon_id, game_id")
    .single()

  if (claimErr || !claimed) return json({ error: "invalid, used, or expired session" }, 401)

  const { error: insErr } = await supabase.from("game_scores").insert({
    session_id,
    anon_id: claimed.anon_id,
    game_id: claimed.game_id,
    score,
    duration,
  })
  if (insErr) return json({ error: "could not record score" }, 500)

  const { data: rankToday } = await supabase.rpc("rank_today", { gameid: claimed.game_id, score_input: score })
  const { data: rankAll } = await supabase.rpc("rank_alltime", { gameid: claimed.game_id, score_input: score })

  return json({ rank_today: rankToday, rank_all_time: rankAll })
})
