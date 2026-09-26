# LawScape — 30-second feature demo

Final delivery: `../lawscape-demo-30s.mp4` — 1920 × 1080, 30 fps, H.264 (High 4.1, BT.709) with stereo AAC, exactly 30 seconds, 900 frames. Poster frame: `../lawscape-demo-30s-poster.jpg`.

| Time | Beat |
| --- | --- |
| 0.0–3.0 | Title: seal and pixel logo drop over the live-rendered office. "A new way to learn legal ethics." PRESS START. |
| 3.0–5.8 | Step 01 · Create your attorney: the real creator screen plus a roster of six in-engine attorneys. |
| 5.8–9.0 | Explore the firm: live walk through the main office with callouts (BarMail, filing cabinet, rule library, Liz Loza). |
| 9.0–13.0 | Step 02 · BarMail: real inbox, a real scenario, the pointer picks the correct reply, real verdict, "+42 gold" coin pop. Practice packs: US MPRE-style, England & Wales SQE-style, State of Juris. |
| 13.0–15.6 | Step 03 · The Journal: real Associate's Desk (quest journal, then the evidence room). |
| 15.6–18.0 | The Courtroom: live render, Derek Balam and the sleeping AI judge. |
| 18.0–20.4 | The Sidebar lounge: live render, B.A.R.T., hall-of-fame board, topic tables. |
| 20.4–22.4 | Your apartment: live render with the city-view upgrade. |
| 22.4–24.0 | Meet the partners: the corner office, Linda's office and the conference room, live side by side. |
| 24.0–27.3 | Legal ethics from around the world: the real Firm Jurisdictions page (27 targets, 4 regions), "play today" vs "the ambition". |
| 27.3–30.0 | End card: logo, "Play the beta", play URL, disclaimer, fade. |

Transitions are a Zelda-style diamond iris and a horizontal wipe with a brass edge; the incoming scene pre-rolls 0.4 s so its entrances are already moving when revealed. Headlines use an original 5×7 bitmap pixel font drawn on canvas; body copy is Georgia to match the game's parchment UI.

## Provenance

- World footage is rendered live from the game's own renderer, zones, props and actors (`js/engine/renderer.js`, `js/world/zones.js`, `js/entities/actor.js`) at 2× zoom with a synthetic demo save (all office and apartment upgrades owned).
- UI screens are real captures from the current local build in a fresh headless Chromium profile with a synthetic save (`captures/receipt.json`). No personal save was read. The BarMail beat records an actual correct answer to "That bad case — just leave it out?".
- The jurisdiction copy comes from the game's own Firm Jurisdictions page and `docs/JURISDICTIONS.md`: MPRE- and SQE-style packs are playable now; the 27 places are curriculum targets, not live packs. The video says so on screen.
- The soundtrack is an original chiptune cue synthesized by `score.mjs` (square, pulse, triangle and noise voices; 128 BPM; A minor to A major). No samples, stock music or voice.
- The game source was not changed for this video. `js/lawscape.bundle.js` was rebuilt with `node scripts/build.mjs` so the captures reflect the current source.

## Production files

- `capture.mjs` — captures the UI screens into `captures/` (run from anywhere; serves the repo through Playwright route fulfillment).
- `film.html` — the composition: scene timings, pixel font, transitions, live world views.
- `render.mjs` — renders 900 deterministic frames and encodes `picture.mp4`; `--stills [t1,t2,…]` writes review frames to `qa/`.
- `score.mjs` — generates `score.wav`.
- `master.mjs` — two-pass loudness normalization (−16 LUFS, −1.5 dBTP target), BT.709 tagging, mux, poster export.
- `qa/` — ffprobe output, render receipt, contact sheets, score spectrogram.

Order: `node capture.mjs && node render.mjs && node score.mjs && node master.mjs`. The scripts reference this workstation's Playwright runtime and headless Chromium build (see the paths at the top of `capture.mjs` and `render.mjs`).

## Validation

- Probed: 1920×1080, 30/1 fps, 900 video frames, yuv420p BT.709, AAC 48 kHz stereo, duration 30.000 s (`qa/ffprobe.json`).
- Decoded start to end without errors.
- Measured loudness of the delivered file: −16.0 LUFS integrated, −2.4 dBTP true peak.
- Every scene and every transition frame was visually inspected at full resolution before and after encoding (`qa/final-contact-sheet.jpg`, `qa/final-transitions-sheet.jpg`).
