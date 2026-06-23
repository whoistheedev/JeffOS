// ============================================================================
// Edge Function: spotify-token
// ----------------------------------------------------------------------------
// Mints a fresh Spotify access token for the JeffOS iTunes app. Tries the
// PERSONAL path first (refresh_token grant → full Web Playback SDK, requires the
// owner's Premium account); on any failure falls back to client_credentials
// (app-only token → 30-second previews).
//
// Tokens last ~1 hour, so this is called on a timer by the client AND kept warm
// by a pg_cron job (see supabase/migrations/*_spotify_token_keepalive.sql) so
// the refresh token never lapses from disuse and silently downgrades everyone
// to previews.
//
// Secrets (Edge Function env): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET,
//   SPOTIFY_REFRESH_TOKEN, SPOTIFY_PLAYLIST_URI (optional).
//
// verify_jwt is false: this is a public, no-login app endpoint. It returns only
// a short-lived, scoped Spotify access token — never the refresh token or
// client secret.
// ============================================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID")
const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET")
const REFRESH_TOKEN = Deno.env.get("SPOTIFY_REFRESH_TOKEN")
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
        refresh_token: REFRESH_TOKEN ?? "",
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
