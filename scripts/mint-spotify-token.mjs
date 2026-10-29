#!/usr/bin/env node
/**
 * Mint a fresh Spotify REFRESH TOKEN for the JeffOS iTunes app.
 *
 * Why: the stored SPOTIFY_REFRESH_TOKEN was rejected by Spotify, so the app
 * fell back to 30-second previews. This walks you through re-authorizing with
 * your Spotify account and prints the new refresh_token to paste into the
 * Supabase Edge Function secret SPOTIFY_REFRESH_TOKEN.
 *
 * It runs a tiny localhost server to catch the OAuth redirect automatically —
 * no copy/pasting the ?code= by hand.
 *
 * USAGE:
 *   1. In the Spotify Developer Dashboard (https://developer.spotify.com/dashboard)
 *      open your app → Settings → add this Redirect URI EXACTLY:
 *          http://127.0.0.1:8888/callback
 *      (Save.)
 *   2. Run:
 *          SPOTIFY_CLIENT_ID=xxxx SPOTIFY_CLIENT_SECRET=yyyy node scripts/mint-spotify-token.mjs
 *   3. Your browser opens → log in / approve. The script prints the refresh token.
 *   4. Paste it into Supabase → Edge Functions → Secrets → SPOTIFY_REFRESH_TOKEN.
 */
import { createServer } from "node:http"
import { exec } from "node:child_process"

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const PORT = Number(process.env.PORT) || 5173
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`

// Scopes: playback control + reading state + private playlists + STREAMING
// (streaming is required by the Web Playback SDK for full-track personal mode).
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "streaming",
].join(" ")

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\n❌ Missing env vars.\n\n   Run it like this:\n   SPOTIFY_CLIENT_ID=xxxx SPOTIFY_CLIENT_SECRET=yyyy node scripts/mint-spotify-token.mjs\n",
  )
  process.exit(1)
}

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    show_dialog: "true",
  }).toString()

function openBrowser(url) {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`
  exec(cmd, () => {})
}

const server = createServer(async (req, res) => {
  // Ignore favicon / other noise so it doesn't look like a failed callback.
  if (req.url === "/favicon.ico") {
    res.writeHead(204).end()
    return
  }
  if (!req.url.startsWith("/callback")) {
    res.writeHead(404).end("not found")
    return
  }
  const params = new URL(req.url, REDIRECT_URI).searchParams
  const code = params.get("code")
  const error = params.get("error")
  if (error) {
    const msg = `Spotify returned error="${error}". ${
      error === "access_denied"
        ? "You clicked Cancel/Don't agree — re-run and click AGREE."
        : "Usually a redirect-URI mismatch: add EXACTLY http://127.0.0.1:8888/callback in your Spotify app settings."
    }`
    res.writeHead(400, { "Content-Type": "text/plain" }).end(msg)
    console.error("\n❌ " + msg + "\n")
    setTimeout(() => server.close(), 300)
    return
  }
  if (!code) {
    // No code AND no error — the page was opened directly, not via Spotify.
    res
      .writeHead(400, { "Content-Type": "text/plain" })
      .end("No ?code in callback. Don't open this URL directly — start from the Spotify authorize link the script printed.")
    console.error("\n⚠️  Got a /callback with neither code nor error (direct hit?). Full URL: " + req.url + "\n")
    return
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    })
    const data = await tokenRes.json()

    if (!data.refresh_token) {
      res.writeHead(500, { "Content-Type": "text/plain" }).end(
        "Token exchange failed:\n" + JSON.stringify(data, null, 2),
      )
      console.error("\n❌ Token exchange failed:\n", data, "\n")
      server.close()
      return
    }

    res.writeHead(200, { "Content-Type": "text/html" }).end(
      "<h2>✅ Success — refresh token minted.</h2><p>Return to your terminal, copy the token, and close this tab.</p>",
    )

    console.log("\n========================================================")
    console.log("✅ SPOTIFY_REFRESH_TOKEN (paste into Supabase Edge secrets):\n")
    console.log("   " + data.refresh_token)
    console.log("\n   (scope granted: " + (data.scope || SCOPES) + ")")
    console.log("========================================================\n")
  } catch (err) {
    res.writeHead(500).end("Error: " + err.message)
    console.error(err)
  } finally {
    setTimeout(() => server.close(), 500)
  }
})

server.listen(PORT, () => {
  console.log(`\n🔑 Opening Spotify authorization in your browser…`)
  console.log(`   If it doesn't open, paste this URL manually:\n\n   ${authUrl}\n`)
  console.log(`   (Make sure ${REDIRECT_URI} is added as a Redirect URI in your Spotify app settings.)\n`)
  openBrowser(authUrl)
})
