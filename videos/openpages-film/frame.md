---
name: OpenPages — Precision in motion
colors:
  canvas: '#f7f7f8'
  bg: '#f7f7f8'
  ink: '#0d0d0d'
  text: '#0d0d0d'
  muted: '#626268'
  surface: '#ffffff'
  chrome: '#ececec'
  border: '#dedee0'
  green: '#10a37f'
  green-dark: '#087b60'
  blue: '#0566ff'
  light-blue: '#a8c8ff'
typography:
  display: {family: Geist, weight: 500}
  body: {family: Geist, weight: 400}
  label: {family: Geist, weight: 500}
---

# Art direction

OpenAI-adjacent confidence, genuinely specific to OpenPages. Clean sans only.
One coherent graphic world. Oversized type, beautifully spaced, precise causal
motion. No decorative gradients, particle soup, gratuitous glow, lorem ipsum,
emoji, stock mockups, faux brand marks, gratuitous counters or fake metrics.

1920×1080 authoring canvas. Root dimensions 100%; data-width/data-height 1920/1080.
Font: @font-face Geist, src url('assets/fonts/geist.woff2'), weight 100 900. This
path is project-root-relative in the assembled document, not ../../assets.
Root inherits Geist. Display 120–180px, weight 500, tracking -0.055em, line-height
1.04. UI headings 42–58px. Body 28–34px. UI secondary labels 23–26px. Tiny
colophon 20px is allowed but never load-bearing. Ink on paper; paper on ink.
Muted copy #626268 on paper, #b5b5bc on dark. Blue #0566ff on white and light blue
#a8c8ff on dark. Green-dark #087b60 for readable text on white.

Minimum edge inset 110px. Optical alignment, actual empty space. Cards are
product surfaces only, 18–28px radius, border 1.5px #dedee0, soft shadow only on
large floating UI panels. Diamond brand mark supplied at assets/openpages-mark.svg.
Use the supplied SVG as an image, or crop its real geometry exactly, no new logo.

Every scene starts at local 0 and lasts exactly 8 seconds. Composition IDs match
the filenames: 01-opening, 02-workspace, 03-compression, 04-finale. Prefix descendant DOM IDs and CSS classes with s01-/s02-/etc.
Each file template wraps the style, root, and script. Root id/data-composition-id
uses scene-0N as its DOM id; data-composition-id and timeline key match the filename. GSAP is provided by parent; no remote imports.
Background is own class=clip timed layer for entire 8 seconds. Shared typography
and assets are still embedded per file so it survives assembly cleanly.
No audio in child files. Parent owns the original synchronized score.

Smooth long-tail motion, crisp fast cuts, directional masked reveals. No elastic
bounce. Elements hold when they have landed; no aimless independent drift. Use
one deliberate 3D document camera action in the compression sequence. Keep text
legible throughout primary holds. Beat grid 0.5s. Larger cuts 2/4/6/8 seconds.
Scene transitions are cuts. Internal match moves preserve element identity.
No recurring scene numbers, progress bars, or other presentation chrome.

Product demonstration surface references actual features but is deliberately
art-directed. No fake claims, security badges or savings percentages. The sample
answer and demo page copy are illustrative, not an actual agent response.
