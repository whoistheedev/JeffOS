import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Public, no-login app: auth is the per-session token issued here and validated
// (single-use) in game-submit — NOT a JWT (deployed with verify_jwt:false).
// CORS required for browser fetch. See GAME_SCOREBOARD_SCALABILITY_AUDIT.md.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } })

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "method" }, 405)

  let anonId: string, gameId: string
  try {
    const body = await req.json()
    anonId = String(body.anonId ?? "").slice(0, 64)
    gameId = String(body.gameId ?? "").slice(0, 64)
  } catch {
    return json({ error: "bad request" }, 400)
  }
  if (!anonId || !gameId) return json({ error: "anonId and gameId required" }, 400)

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SERVICE_KEY")!)

  const session_id = crypto.randomUUID()
  const token = crypto.randomUUID()
  const seed = crypto.randomUUID().slice(0, 12)
  // 2-hour TTL — matches the column default; explicit so it's auditable here.
  const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from("game_sessions")
    .insert({ session_id, anon_id: anonId, game_id: gameId, token, seed, expires_at, used: false })

  if (error) return json({ error: "could not start session" }, 500)

  return json({ session_id, token, seed })
})
