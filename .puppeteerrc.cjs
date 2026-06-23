const { join } = require("path")

/**
 * Puppeteer config — used only at BUILD time by scripts/prerender-home.mts to
 * snapshot the homepage into static HTML (see that file). Not shipped to the
 * client.
 *
 * Vercel/CI caches `node_modules` but NOT `~/.cache`, so by default the
 * Chromium that Puppeteer's postinstall downloads can disappear before the
 * build step runs. Pinning the cache into the project directory makes it part
 * of the cached workspace, so the browser is present when prerender-home runs.
 * (If it's still missing for any reason, prerender-home logs a warning and
 * leaves the shell index.html as-is — the build never fails.)
 */
module.exports = {
  cacheDirectory: join(__dirname, "node_modules", ".cache", "puppeteer"),
}
