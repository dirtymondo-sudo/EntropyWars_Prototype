# BLENDER VFX GUIDE — how to make spell VFX for Entropy Wars in Blender

> **RETIRED 2026-11-08 (mondo):** the Blender fire + smoke flipbooks were removed from the game. Riot's VFX style guide p.28
> names sim/photo fire and smoke the thing NOT to do. Kept as history only; do not bake spell VFX in Blender again.
> Notes: docs/notes/spells-vfx.md "THE BLENDER FIRE + SMOKE REVERTED".

Written 2026-11-05 (rewrite of the 11-03 draft that was lost with its machine; see "Why this was rewritten" at the end).
Tool: `bake-vfx.py` (repo root). Game side: three-vfx.js THE FLIPBOOKS + three-vfx-effects.js. Notes: docs/notes/spells-vfx.md.
Sources: the Blender 5.2 manual (Fluid / Mantaflow, Principled Volume, Force Fields, Particles, Geometry Nodes), the common
practice of the well-known fire/smoke/explosion tutorial series (JangaFX/EmberGen-style flipbook workflow, the Blender Guru /
CG Geek / Josh Gambrell style Mantaflow explosion and fire setups, the "VFX for games" flipbook talks), and what the bakes in
this repo actually measured. YouTube refuses transcript downloads from the cloud box, so nothing here is quoted from a video.

## 1. What a game VFX sheet is (and why the old ones looked cheap)
- A FLIPBOOK is a short sim rendered to N transparent frames and packed into one grid PNG. The game steps a sprite through the
  cells over the particle's life. The look comes from the SIM (real billowing, licking, rolling), not from painting.
- Two kinds of light in fire: the fire's OWN light (emission, adds light, never darkens) and the SMOKE (lit by the sun/sky,
  covers what is behind it). Rendering both into one normal-blended sprite makes the fire dull and muddy. AAA sheets ship
  them as TWO passes of one sim:
  - `*_glow.png`: emission only, rendered on black; brightness becomes alpha; drawn ADDITIVE.
  - `*_smoke.png`: the lit smoke on a transparent film; drawn NORMAL blend, under the glow.
- A one-shot sheet must END EMPTY. If the last cell still holds dense smoke, no opacity curve in the game can hide the pop
  (mondo 11-03: "if it were truly faded the last frame would be basically transparent"). Measure it: `sheet2` prints the last
  frame's max alpha and coverage. Target: max alpha < 10, coverage ~0.
- A looping sheet (a fireball in flight, a meteor tail) must have no seam: run the sim past the window and cross-fade the
  extra frames into the first ones (`sheet2 ... loop=k`).
- Every effect needs its own sim. Fireball and Meteor sharing one sheet (11-03) is exactly what reads as low effort.

## 2. Mantaflow gas sims: the settings that matter
Domain (Gas):
- `resolution_max` 96-144 for sprites up to 256 px; `use_noise` (noise upres x2) adds the fine curls for almost no cost.
- Buoyancy: `alpha` (density: positive = heavy smoke sinks) and `beta` (heat: hot gas rises). Fire = low alpha, beta 1-2.
- `vorticity` 0.1-0.3: higher makes swirly "noodle" smoke; flames get their own `flame_vorticity`.
- Fire: `burning_rate` (how fast fuel burns = flame length), `flame_smoke` (smoke made by burning), `flame_ignition`,
  `flame_max_temp`.
- DISSOLVE: `use_dissolve_smoke` + a SHORT `dissolve_speed` (frames) with `use_dissolve_smoke_log` (exponential, reads as
  natural thinning). The 11-03 pilot used 110 frames on a 64-frame sim: the smoke never thinned. Use 10-25.
- Border collisions: turn them OFF on the sides/top (gas leaves the box instead of piling up against an invisible wall);
  keep the BOTTOM on for a ground blast so it spreads along the floor.
- Cache: `REPLAY` + stepping `frame_set` 1..N in order bakes it. Changing ANY data on the domain afterwards (even its
  material list) frees the replay cache; switch render passes with the VIEW LAYER `material_override` instead.

Flow (emitters):
- Never fake an explosion with a big initial velocity. A strong push sweeps the gas out of the box within a few frames and
  the blast never grows (that was the 11-03 bug). Instead BALLOON the emitter: keyframe its scale from small to big over the
  first 6-8 frames with inflow on, then switch inflow off. The gas fills the growing shape like a real fireball.
- LUMPY emitters (a few joined spheres, not one ball) give lobes and cauliflower detail instead of a pom-pom.
- `surface_distance` 0.4-0.8 gives a soft emission shell.
- Keyframe `use_inflow` to cut the emitter off (one-shots) or leave it on (loops).
- Moving emitters make stems/trails (the meteor blast's rising column is a fire lump keyframed upward).

Forces (Force Field empties, they act on the gas):
- TURBULENCE (strength 2-5, size 0.2-0.45) breaks up the silhouette. Put one low near the floor for dust.
- WIND for anything that flies: keep the source still and blow the wind past it (cheaper and loops forever).
  Too strong a wind flattens the flame into a rod; 2-4 with turbulence gives licking flames that trail.

## 3. Shading (Cycles, Principled Volume)
- Smoke: Principled Volume, Density 6-9 (higher self-shadows into black), a constant colour (light grey for a fireball,
  brown-grey dust for a ground blast, dark grey for a meteor), sun ~3 + sky 0.7 so the shadow side is not black.
  Do NOT use Mantaflow's `color` attribute in Cycles 5.2: tested, it renders near-black.
- Fire: the `flame` attribute -> a colour ramp -> Emission Colour, `flame` x strength -> Emission Strength. The ramp is the
  art direction: Fireball = orange body, yellow-white core; Meteor = deep red body, white-hot core.
- Keep the glow pass from blowing out to flat white: emission strength ~8-12 with the Standard view transform.
- A little absorption (density ~2.5, black) in the glow pass lets smoke in front dim the fire: free depth.
- Render: orthographic camera, 256 px frames, 24 spp + denoise, then downsample to 128 px cells (LANCZOS).

## 4. Sparks, beams, portals (no gas needed)
- SPARKS / embers: a particle system (or Geometry Nodes points) with gravity + drag, rendered as stretched emissive streaks
  (motion blur ON, short shutter) on black -> glow sheet. In game, spark VELOCITY is better done live by the particle pool;
  bake only the look of one spark/ember cell.
- BEAMS: model a cylinder with UVs running along it; scroll a baked noise texture along the V axis in the game. Bake in
  Blender: a seamless tiling noise strip (Wave + Noise textures, emission) rendered flat, 2-3 layers at different speeds.
- PORTALS / rings / shockwaves: a flat emissive disc with a polar-coordinates noise, or a short sim of a thin ring emitter
  scaled outward; one-shot sheet like an explosion, or a tiling radial texture the game spins.
- Distortion/heat haze is a screen effect, not a sheet.

## 5. The game side (Entropy Wars)
- three-vfx.js `_FLIPBOOKS`: each sheet's url, cols, frames, cell, blend (`nrm` smoke / `add` glow), `lift`, `feather`.
  `_fbLoadAll` slices the sheet into per-frame textures; a particle's sprite key steps through them.
- Online: spell VFX run inside relayed `fire()` intents, so host and guest both play them; fogged tiles stay empty.
- Sheet URLs on R2 have no ?v= token: bump `?r=N` on the url in `_FLIPBOOKS` on every re-bake.
- Draw order: smoke particle first, glow particle on top (additive); both behind the victim from the lens.
- A sheet that already ends empty plays to its last frame with opacity going to 0; no extra engine tail needed (`tail: 0`).

## 6. Pipeline (bake-vfx.py)
```
curl -O https://download.blender.org/release/Blender5.2/blender-5.2.3-linux-x64.tar.xz && tar xf ...   # pip bpy crashes in Mantaflow
PRESET=fbhit QUICK=1 blender -b --factory-startup -P bake-vfx.py -- sim /tmp/q/fbhit    # 48-res framing check, ~30 s
PRESET=fbhit blender -b --factory-startup -P bake-vfx.py -- sim /tmp/fbhit              # full bake, both passes
python3 bake-vfx.py sheet2 /tmp/fbhit Assets/fx/sprites/fb_fbhit 1 36 6 128 1          # -> fb_fbhit_smoke.png + _glow.png
```
Presets: `fbhit` (Fireball hit), `mblast` (Meteor ground blast), `fbfly` (Fireball in flight, loop), `mtail` (Meteor tail,
loop), plus the older `explosion` / `smoke` / `fire` (`render` mode).

## 7. Rules for threads doing bakes
- PUSH AS YOU GO: commit + push the script and each finished sheet the moment it exists, and copy frames to
  /mnt/project-files/blender-vfx/. Cloud machines die and are wiped; the 11-03 thread lost a whole day of work that way.
- Low-res framing check first (QUICK=1), look at the strip, then the full bake.
- Prove it in the real game with frames, not only the Blender render.

## Why this was rewritten
The 11-03 thread "Learn Blender VFX and remake fireball" drafted this guide and four sims but kept all of it on its own
cloud machine; the machine died mid-bake and nothing was ever pushed. This rewrite redoes the findings it had reported
(ballooning emitters instead of push speeds, short dissolve, two passes) and adds what the 11-05 bakes measured.
