# HerWebsite — Refined Cinematic Edition

## Run it
1. Extract this folder.
2. Open it in VS Code.
3. Put your music at `assets/audio/song.mp3`.
4. Open `index.html` with Live Server.
5. Click **Enter the experience**. The click starts the music and is also the browser-safe user gesture for audio.

## What's refined
- Fresh animated star/aurora background; no city or generated extra objects.
- The supplied couple SVG is stored at `assets/images/couple.svg` and used only as a subtle distant visual in the post-heart scene.
- Infinite canvas-based petals recycle continuously instead of stopping after a finite batch.
- Responsive typography uses clamp() and mobile breakpoints so text stays inside the viewport.
- Heart interaction uses Pointer Events for mouse + touch, with a generous hit area, magnetic snap threshold, and a tap fallback.
- Welcome button has a high z-index and explicit pointer interaction; no overlay blocks it.
- Moon is CSS-rendered with crater detail, glow, slow movement, and touch/click ripple.
- Poem uses the requested wording and ends with `~Your Rounak`.
- Accessibility: keyboard-focusable controls and reduced-motion support.

## Music
The project expects `assets/audio/song.mp3`. The ZIP intentionally does not contain copyrighted music.
