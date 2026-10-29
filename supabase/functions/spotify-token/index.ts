// ============================================================================
// Edge Function: spotify-token
// ----------------------------------------------------------------------------
// Mints a fresh Spotify access token for the JeffOS iTunes app. Tries the
// PERSONAL path first (refresh_token grant → full Web Playback SDK, requires the
// owner's Premium account); on any failure falls back to client_credentials
// (app-only token → 30-second previews).
//
// The refresh token is stored in SUPABASE VAULT and read at runtime via the
// locked-down RPC public.get_spotify_refresh_token() (EXECUTE granted to
// service_role only). Falls back to the SPOTIFY_REFRESH_TOKEN env var if the
// Vault read fails. Tokens last ~1 hour, so this is called on a timer by the
// client AND kept warm by a pg_cron job
// (supabase/migrations/*_spotify_token_keepalive.sql) so the refresh token
// never lapses from disuse and silently downgrades everyone to previews.
//
// Env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_PLAYLIST_URI (optional),
//   SPOTIFY_REFRESH_TOKEN (optional fallback). SUPABASE_URL +
//   SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.
//
// verify_jwt is false: public, no-login endpoint. Returns only a short-lived,
// scoped Spotify access token — never the refresh token or client secret.
// ============================================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID")
const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET")
const ENV_REFRESH_TOKEN = Deno.env.get("SPOTIFY_REFRESH_TOKEN")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const PLAYLIST_URI =
  Deno.env.get("SPOTIFY_PLAYLIST_URI") || "spotify:playlist:37i9dQZF1E3a5sJA1yoP7o"

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
}

/* ---------- Read the refresh token from Vault (env fallback) ---------- */
async function getRefreshToken(): Promise<string | null> {
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_spotify_refresh_token`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      })
      if (res.ok) {
        // The RPC returns a scalar text (JSON string) or null.
        const val = await res.json()
        if (typeof val === "string" && val.length > 0) return val
      } else {
        console.warn("⚠️ Vault RPC non-OK:", res.status, await res.text())
      }
    } catch (e) {
      console.warn("⚠️ Vault RPC failed, using env fallback:", (e as Error).message)
    }
  }
  return ENV_REFRESH_TOKEN ?? null
}

/* ---------- Fallback: client_credentials (previews only) ---------- */
async function fetchClientCredentials() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  const data = await res.json()
  if (!data.access_token) console.error("⚠️ Failed to get fallback credentials:", data)

  return {
    access_token: data.access_token ?? null,
    token_type: data.token_type ?? "Bearer",
    expires_in: data.expires_in ?? 3600,
    mode: "fallback",
    switch_hint: "enable_previews", // tells the UI to skip the SDK
  }
}

/* ---------- Main handler ---------- */
serve(async (req) => {
  // CORS preflight (the client calls this cross-origin).
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  try {
    const refreshToken = await getRefreshToken()
    const basic = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)

    // Try refreshing the personal access token first.
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken ?? "",
      }),
    })

    const data = await res.json()

    // Fallback if the refresh failed / token was revoked.
    if (!data.access_token || data.error === "invalid_grant") {
      console.warn("⚠️ Personal refresh failed — switching to client credentials.")
      const fallback = await fetchClientCredentials()
      return new Response(
        JSON.stringify({ ...fallback, playlist_uri: PLAYLIST_URI, switched_from: "personal" }),
        { headers: corsHeaders() },
      )
    }

    // Refreshed personal token (full playback).
    return new Response(
      JSON.stringify({
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        mode: "personal",
        playlist_uri: PLAYLIST_URI,
        switch_hint: "resume_playback",
      }),
      { headers: corsHeaders() },
    )
  } catch (err) {
    console.error("Spotify Edge error:", err)
    const fallback = await fetchClientCredentials()
    return new Response(
      JSON.stringify({
        ...fallback,
        playlist_uri: PLAYLIST_URI,
        error: (err as Error).message,
        switched_from: "personal",
      }),
      { status: 500, headers: corsHeaders() },
    )
  }
})
