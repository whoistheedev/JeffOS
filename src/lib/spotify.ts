export async function loginWithSpotify() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const redirectUri = window.location.origin + "/callback"
  const scope = "user-read-playback-state user-modify-playback-state playlist-read-private"

  const verifier = crypto.getRandomValues(new Uint8Array(64))
    .reduce((acc, x) => acc + String.fromCharCode(65 + (x % 26)), "")

  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

  localStorage.setItem("spotify_verifier", verifier)

  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${challenge}&code_challenge_method=S256`

  window.location.href = url
}
