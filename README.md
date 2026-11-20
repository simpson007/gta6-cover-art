# Vice City Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/simpson007/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/simpson007/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photo and a caption into GTA 6-style multi-panel cover art, and export it as a PNG to share. A static web app — no build step, no network requests, your photos never leave your machine.

## What it does

- **Multiple panels**: pick Triptych (3 vertical panels), Hero + strip, Duo, or a Single full-bleed photo. Upload your own photos (several at once) or try the two free sample photos included. Fill several panels with one photo or several.
- **Crop and position each panel**: drag on the preview to pan, and use the per-panel zoom slider.
- **Caption**: editable main title and optional subline in big bold condensed lettering (Anton, SIL OFL, vendored locally), with five colour/gradient styles, outline and neon glow, top or bottom position.
- **Vice City grade**: magenta → orange → purple sunset wash, vignette, an original skyline and palm silhouette drawn with canvas paths, subtle film grain, and a neon accent frame (pick the colour). Four grade presets, or none.
- **Export**: one click downloads the PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Upload a photo, pick a layout and size, type a caption, hit **Export PNG**.

## Files

- `app/index.html`, `app/style.css` — the editor page
- `app/src/cover.js` — the cover renderer (panels, grade, skyline, palms, caption)
- `app/src/main.js` — editor wiring (uploads, pan/zoom, export)
- `app/src/shots.js` — `?shot=` scenes for screenshots
- `app/fonts/Anton-Regular.ttf` (+ `OFL.txt`) — Anton, SIL Open Font License
- `app/samples/` — two sample photos made with an image model for make.fun, free to use
- `main.ts` — the make.fun entry program (copies `app/` + `screenshots/` to `/output`, writes `dossier.json`)

Original design: no Rockstar Games logos, artwork, characters or fonts anywhere.

## License

MIT — see [LICENSE](LICENSE).
