# THE INSIDE OF THE BLACK CUBE (the DMT realm), the plan

mondo 2026-11-27: "make a DMT realm dungeon map. This would be the 'inside' of the black cube. This place should be totally
psychadelic and closely resemble DMT trip reports and art and sacred geometry and fractal patterns and psychadelic weirdness,
while still being possible to do grid combat like usual. I want it to feel like the player is on DMT ... Make a plan/guide, will
probably need several iterations/passes ... after you make the plan start with the first step."

The plan he reads is the Claude Doc "DMT realm: the inside of the black cube, the plan"
(https://claude.ai/artifact/Jh8PpVbEitWL7cFLx9XgEX). This file is the repo's copy of what binds the build.
His four reference pictures (walls of eyes, a neon cube matrix, a tunnel mandala, sacred geometry) are MOOD ONLY: every
pattern is drawn by the game's own code. Proof pictures: project files `dmt-realm/pass1/`.

## The rules
- THE FIGHT GRID IS ALWAYS READABLE: the floor sheet draws the grid itself (one sheet = one 3.5 m fight square, its edge lit,
  the pattern inside dim). The loud things are on the walls and in the air, never under the units.
- No ground past the platforms, only the drop; every platform edge wears a kerb of light, open only at a bridge's mouth; solid
  pieces on whole squares with a ghost wall; `node find-softlocks.js site_prebuilt_cube_dmt` = 0.
- BOTH RENDERERS: plain three.js materials + drawn canvases (THE TRIP SHEETS). No GLSL, no onBeforeCompile, no new shader.
- Slow, never strobing (photosensitive players). A screen-wide effect (pass 3) ships with a strength setting and an off switch.
- No lore, residents or names made up: his calls (the questions below).

## The passes
| Pass | What | Waits for |
|---|---|---|
| 1 THE ROOM (built 11-27) | the cube, nine platforms, bridges, nine trip sheets, first dressing, kerbs, a field fight checked | his look |
| 2 DEPTH + FRACTALS | things inside things (platforms repeated smaller into the distance, a tunnel walked through, stairs that mirror themselves, islands above and below), each platform's own identity, more height for fights | which platforms he likes |
| 3 THE TRIP ITSELF | the screen effect: breathing, colour drift, soft trails, the walls leaning in when he stands still, the room answering spells. MOCK-UP FIRST (a camera / screen design: owner-rules), strength slider + off | his OK on the mock-up |
| 4 THE ENTITIES | residents, a boss spot under the black cube, things that follow with their eyes | the resident list, where the Demiurge stands |
| 5 THE WAY IN AND OUT | the door from the world and back, the arrival (the tunnel rush), its place in the story | where the cube is entered from |
| 6 SOUND + THE ARENA | music / room tone from his library (never generated), the 8 x 8 PvP arena (`bake-arenas.js`), the map picture (`bake-map.js`) | the music pick |

## Open questions (asked 11-27)
1. The way in (pass 1 has NO door: `_hqEnter({ from: 'play', room: 'site_prebuilt_cube_dmt' })` or the editor until he picks).
2. Who lives here (existing units that fit: Occulus, Floating Brain, Orb of Light; the Demiurge as the boss).
3. The room's name (the card reads THE BLACK CUBE · THE INSIDE).
4. How strong the trip (pass 3).
