import React from "react"
import type { GameItem } from "../EmulatorApp"

export function EmulatorFrame({ game, shader }: { game: GameItem; shader: string }) {
  const srcDoc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      height: 100%;
      background: #000;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="EJS_player" style="width:100%;height:100%"></div>
  <script>
    window.EJS_core = "${game.core}";
    window.EJS_gameUrl = "${game.url}";
    window.EJS_gameName = "${game.title}";
    window.EJS_player = "#EJS_player";
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_language = "en-US";
    window.EJS_disableAutoLang = true;
    window.EJS_backgroundBlur = true;
    window.EJS_backgroundColor = "rgba(10,10,10,0.9)";
    window.EJS_color = "#57A6F5";
    window.EJS_volume = 0.8;
    window.EJS_startOnLoaded = true;
    window.EJS_defaultOptions = { shader: "${shader}" };
  </script>
  <script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
</body>
</html>
  `

  return (
    <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
      {/* The iframe fills the play area absolutely so the emulator always uses
          ALL available space (key for short landscape viewports — EmulatorJS
          scales the game to fit its container). */}
      <iframe
        key={game.url + shader}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-same-origin"
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay; fullscreen"
        title={game.title}
      />

      {/* glass reflection overlay (decorative, non-interactive) */}
      <div className="absolute inset-0 bg-gradient-to-b
        from-white/5 to-transparent mix-blend-overlay pointer-events-none" />
    </div>
  )
}
