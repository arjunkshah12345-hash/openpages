# OpenPages — Make room

An original 32-second product introduction. Editable HTML/GSAP compositions,
original 120 BPM music and sound design, four connected movements.

## Deliverables

- `renders/openpages-intro-4k.mp4` — 3840 × 2160, 60 fps master.
- `../../public/media/openpages-intro.mp4` — 1080p web edition, embedded on the landing page (`/`).
- `snapshots/contact-sheet-1.jpg`, `snapshots/contact-sheet-2.jpg` — timed proof frames.
- `assets/audio/master.wav` — 48 kHz stereo master.
- `assets/audio/score.wav`, `sound-design.wav` — separate original audio stems.

## Scenes

| Time | Composition | Story |
|---|---|---|
| 00–08 | `01-opening` | Big ideas need room. Meet OpenPages. |
| 08–16 | `02-workspace` | Pages, editing, a question, and source retrieval. |
| 16–24 | `03-compression` | SuperCompress selects evidence and grounds the answer. |
| 24–32 | `04-finale` | Model freedom, MCP, and an open-source invitation. |

The UI and example answer are art-directed demonstrations of real features,
not a recording of a live model session. No invented savings metrics.

## Edit and render

```sh
npm run dev
npm run check
npm run render -- --quality delivery --resolution 4k --fps 60 --workers 2 --output renders/openpages-intro-4k.mp4
```

`index.html` mounts the four scenes and the mastered soundtrack. Each scene is
an 8-second local timeline. Font, logo and GSAP are local, so rendering needs no
external asset requests. Preserve the explicit local runtime path if reassembling
with a workflow script.

The renderer pin was upgraded from 0.8.95 to 0.8.99 and verified with the full
runtime, layout, motion and contrast check. The single repeated-logo discovery
advisory is intentional: the same OpenPages mark appears in three different
locations in the workspace scene. All three were visually checked.

The 3D source stack uses scoped overlap annotations on its sheet text because
axis-aligned projected bounds overlap; the actual opaque surfaces and the final
answer were checked visually. No scene-wide layout exemptions are used.

Recreate the score with `python3 scripts/score.py` (NumPy and SciPy), then master
`assets/audio/mix.wav` with FFmpeg loudnorm: `I=-16:TP=-1.2:LRA=7`, 48 kHz PCM.
See `ASSETS.md` for provenance.
