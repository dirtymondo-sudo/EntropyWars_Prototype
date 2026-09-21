# PREMIUM_POLISH_PLAN.md — the AAA pass over D.O.O.R. HQ and the explorable areas

*2026-09-21. The user: "What else can we add to make the game feel more like a premium AAA experience? Fog? God
rays? Shaders? Post processing? Shadows? More tweaking and polishing of the maps and props and interactable
objects? Let's make a plan." This is the plan. Read `EXPLORABLE_AREAS_GUIDE.md` and `AREA_CONTENT_PLAN.md`
first — they own the LAYOUT of the areas; this doc owns how they LOOK, SOUND and FEEL. Append to §8.*

## 0 · What the renderer has today (measured 2026-09-21, three r128)

| Layer | THE BATTLE (a Δ board) | THE HQ + THE AREAS |
|---|---|---|
| Shadows | ONE sun `DirectionalLight` shadow map, `PCFSoft`, quality off / low / high (`three-post.js` `_shadowQuality`), dirty-gated depth pass | **NONE** — no HQ light casts, no room mesh receives (`_hqEnter`'s light block sets no `castShadow`) |
| Materials | Lambert with the self-glow emissive trick; a few Standard | `MeshPhongMaterial` + a diffuse map only (`_hqMat`); no normal / roughness / AO maps anywhere (2 `normalMap` reads in 53 k lines) |
| Fog | the dome shader's own fog + `_applyHorizonFog` altitude fog + THE WORLD's radial haze | one `FogExp2` per room (`sky.fog.density` per metre) — uniform, no height, no colour banding |
| Post | bloom · tilt-shift DoF · FXAA · the cinematic pass (vignette, CRT scanline / chroma / curvature, night grade) · the retro pass (pixel, dither, levels, tint, grain) | the same composer (`ThreePost.renderScene`), a `HQ_ROOM_LOOKS` grade per place that YIELDS to the player's sliders |
| Volumetrics | geometry god rays over the board (`VOLUMETRIC LIGHT SHAFTS`), the nebula clouds | the sea's under-surface rays (`_hqSeaArm`) only; the ley veins glow; nothing in a room |
| Particles / weather | pixie dust, storm lightning, the motion maps' spray / dust, embers | none general — no dust in a sunbeam, no rain, no snow, no fireflies, no embers off a torch (the torch flame is `_torchFlicker`) |
| Audio | music by context, ambience beds (`ambDay` / `ambNight` / `ambWindHigh` / `ambCavern` / `lavaBubble`), the door kit | the lobby / hq / exploration music pools, the hall's ROOM TONE, a way's cue; **no footsteps, no per-room bed, no reverb** |
| Interaction | — | doors, counters, people, finds, vehicles, climbs, the door gun, the deck; nothing in a room MOVES when you touch it |

The building is lit like a diagram: a hemisphere, a key, a fill, point lights — every face readable (the
user's 2026-09-20 brightness complaint is fixed) but nothing GROUNDS an object. That, more than any single
effect, is the gap between "prototype" and "premium": **a chair with no shadow floats; a torch with no
bounce is a sprite; a room with no sound is a screenshot.**

## 1 · The principle — grounding before spectacle

AAA reads come from three things in this order, and each one is cheap next to the one after it:

1. **CONTACT** — shadows and ambient occlusion put objects ON the floor. Nothing else matters until this is
   in. (A: one shadow-casting key per room, baked AO in the vertex colour of the shell.)
2. **AIR** — height fog, dust in a light shaft, the far end of a hall dissolving. Rooms get DEPTH.
3. **LIFE** — footsteps, a bed per room, something that moves when you do (a curtain, a hanging lamp, a
   puddle), NPCs that react, props that respond. Rooms get PRESENCE.

Spectacle (god rays, lens effects, reflections) is the LAST 10 %, and only where a place earns it.

Every item below names its file, its cost, its kill-switch, what the user must eyeball and RULE #2's answer
(every item here is the WALKER's or the VIEWER's — nothing on `state`, nothing relayed; a battle-side item
says so).

## 2 · THE LIGHT PASS (contact) — delivery 1, the biggest win per hour

**2.1 The room key casts a shadow.** In `_hqEnter`'s light block (three-renderer.js ~51630) give ONE
directional light per room `castShadow = true` with an ortho frustum FITTED TO THE ROOM (a box room: the
shell's w × d; a terrain room: the field's box; the rotunda: the drum) and the map size from
`three-post.js`'s `SHADOW_MAP_SIZE[_shadowQuality]` (the battle's own tiers — Settings → Performance already
owns the knob). Shell slabs, terrain, props, people `castShadow` / `receiveShadow` (the prop placer and
`_hqSpawnCharacter` set them; the CSS2D plates and the additive glows never). Reuse the battle's dirty gate:
the HQ scene re-renders the depth pass only when a character moved or a ticker turned (`_hqTickChars` /
`_hqTickWorld` stamp `_shadowsDirty`). An open room's SUN casts the treeline's shadow across the field —
the woods become a place. Cost: one depth pass per dirty frame; a 2048 map on desktop, 1024 low, off on
`EW_PERF_LOW`. Kill-switch `EW_HQ_NO_SHADOWS`.

**2.2 Point-light shadows for the ONE hero light of a lit room.** A torch-lit undercroft, the cathedral's
brazier, the lava lake: `PointLight.castShadow` on the room's `mood.hero` light only (a cube map is six
passes — one per room, never per lamp; `HQ_PROP_LIGHT_MAX` stays 10 for the rest).

**2.3 Baked ambient occlusion in the shell.** The box shell and the terrain mesh get an AO term in their
VERTEX COLOUR at build (a corner darkens 30 % over 0.5 m; a terrain sample under a cliff / in a gully
darkens by its concavity — the height field is already sampled, `hqTerrainHeight`'s neighbours give the
Laplacian for free). Zero runtime cost; it is why the corners of a real room read as corners. The same
darkening under every prop's footprint (`_hqPlaceProps` stamps a soft contact disc — a 4-vertex quad in a
cached radial texture at the foot; the battle already draws `shadowProxy` discs under sprites).

**2.4 The materials get their second map.** `_hqMat` takes an optional `normal` (an `urban:` sheet's
`-Normal` twin where the pack has one — 34 families, most ship a normal) and switches the shell to
`MeshStandardMaterial` (`roughness` 0.85 / `metalness` 0) under a flag per room (`shell.pbr: true`), keeping
Phong as the default until the whole building is graded. A single `PMREMGenerator` environment per room's
sky (the dome rendered once to a 64 px cube) gives the marble, the steel, the glass their reflection. Cost:
one texture per sheet, one cube render per room entry. Kill-switch `EW_HQ_NO_PBR`.

**2.5 The light rig per room.** `HQ_LIGHT_RULES` grows `key: { az, el, color, cast }` per shell (the
morning slant through the Vatican's windows, the noon sun straight down on the Giza plateau, the cold
cyan key of the D.U.M.B. tram hall) — today every room's key comes from (0.45, 1, 0.3). A `shell.rig`
overrides it. The looks table (`HQ_ROOM_LOOKS`) already carries the GRADE; this is the LIGHT under it.

What to eyeball: shadow acne on the terrain (the bias), the frustum clipping a tall tower's shadow, the
cast rigs' self-shadowing on the face (the fill light must stay), the frame rate in the cities.

## 3 · THE AIR PASS (depth) — delivery 2

**3.1 Height fog.** Replace the room's `FogExp2` with a fog that thickens toward the FLOOR: a shared
`onBeforeCompile` hook (`_ewHeightFogHook`, the vertex-tint hook's pattern) adds `density × exp(−(y −
floorY) / fogH)` to every HQ material — a mist over the sea room's swells, the smoke floor of the pit, the
cave's breath along the floor, the cloud banks of the stairway that are CLOUD, not a grey grade. `sky.fog`
grows `{ height, floor }`. Cost: one uniform block. Kill-switch `EW_HQ_NO_HEIGHT_FOG`.

**3.2 Light shafts where a room has a window or a torch.** The battle's geometry god rays
(`VOLUMETRIC LIGHT SHAFTS`, ~29656) already draw additive planes with drifting motes on a light pool —
reuse them as a catalogue proc `light_shaft` (wall, from a window; ceiling, from a skylight; floor, over
a torch) and place them by hand in the ten rooms that earn one: the basilica's rose window, the archive's
stacks, the warehouse's high windows, the cathedral of the catacombs, the well room's shaft, the
observatory's dome slit, the mall's atrium, the garage's ramp mouth, the platform's grate, the dream lab.
Same shader, no new effect. `EW_HQ_NO_SHAFTS`.

**3.3 Dust, embers, fireflies, snow, rain, spores** — ONE particle system, `_hqBuildAtmos(room)`, driven
by `shell.atmos: { kind, n, color, speed, wind }`: `dust` (drifting motes, lit by the shafts), `embers` (rising
off every `_torchFlicker` entry and lava sheet), `fireflies` (the woods at night, the sea of possibility),
`snow` (the North Pole, Antarctica, Shasta's summit), `rain` (the Haunted House's grounds, the sewers' grate,
Disaster City's docks — streaks + ripples on the water sheets), `spores` (the fairy forest), `ash` (the pit,
the ley plateau). Points on an InstancedMesh, ≤ 600 a room, halved on `EW_PERF_LOW`. The battle's
`_motionBuildMotes` is the model.

**3.4 Screen-space ambient occlusion in the composer.** An SSAO pass (three r128 ships `SSAOPass` /
`SAOPass`) between the render pass and bloom, HQ + battle, at half resolution, quality-tiered. It is the
one post effect that reads as "next-gen" on every frame at once. Cost: a depth + normal pre-pass — the
most expensive item in this plan; ship it behind Settings → Graphics · Ambient Occlusion, default ON on
High, OFF on Low. Do 2.3's bake first: with baked AO the SSAO can run at low radius and cost.

**3.5 The far end.** A room whose length exceeds ~40 m (the tram hall, the ring road, the running tunnels)
gets `sky.fog` tuned so the far end is HALF gone — never a visible back wall in a corridor. A rule in
`hq-terrain.test.js`: a halls / ley / city plan's fog reaches 0.5 at ≤ 60 % of the room's diagonal.

## 4 · THE SOUND PASS (presence) — delivery 3, the cheapest AAA tell there is

**4.1 Footsteps.** The walker's tick already knows its surface (`_hqSurface` → the cell's sheet / the
terrain's `path` / `cliff` / a plank / a bridge / water) — map the sheet family to a STEP SET (`concrete` ·
`wood` · `metal` · `carpet` · `grass` · `gravel` · `sand` · `stone` · `water` · `snow`) in audio.js
`STEP_SETS` (4–6 variants each, the pack's `Assets/SFX/steps/`, round-robin never twice), fired at the
stride's contact frames (the walk clip's `strikeAt` pair) at a pitch jitter, quieter on the sneak, a
SPLASH in a wade, a THUD on a landing scaled by the fall, the skateboard's ROLL bed by surface (the wheels
on concrete vs planks) — `three-renderer.js` publishes `onStep({ surface, k })` and map.js plays it. NPCs
step too at half volume within 6 m (the population's `_hqTickChars` has the clip time).

**4.2 A bed per place.** `shell.ambience: [keys]` (the shell copies from the sky row where the battle
already has `env.ambience`): the hall's air handling + distant PA; an office's fluorescent hum; the woods'
birds by day / crickets + an owl by night; the sea's surf + gulls; the cave's drips (the `ambCavern` bed
exists); the city's traffic + a siren every ~90 s + a dog; the pit's roar; the sewers' trickle; the
tram hall's ventilation. `playContextMusic`'s sibling `playRoomAmbience(keys)` crossfades on the room
change (the beds are already a Set with fades). One-shot "world events" on a seeded timer per room
(`shell.events: [{ key, every: [lo, hi] }]`): a distant door slam, a PA line, a crow, a train passing
under the floor.

**4.3 Reverb per room.** A `ConvolverNode` per REVERB CLASS (`small` / `hall` / `cave` / `outdoor` /
`tunnel`, five short impulse responses ~200 KB total; `shell.reverb` names one, defaulted by kind and
size) on the SFX + step bus only (never the music). The door kit already routes through an AudioContext
(the mobile pass); this is one send.

**4.4 Occlusion.** A door's cue and an NPC's line are low-passed when a wall stands between (the
`_hqLosClear` read the encounter already makes; one `BiquadFilter` per voice).

## 5 · THE PROP PASS (life) — delivery 4

**5.1 Things that move.** A catalogue row may carry `sway: { axis, amp, period }` (hanging lamps, banners,
the festoon, the chains, the kelp already does), `wind: true` (the treeline's foliage OBJs get a vertex
sway in the kelp's shader), `spin` (the ceiling fans, the ferris wheel already turns). The rider's / the
walker's wake pushes a hanging prop (`_hqRideObstacleSlide` knows the touch). Curtains and drapes as
`cloth` planes (a 6×6 vertex sheet on a spring, the skirt collision's cousin).

**5.2 Things that respond.** ONE mechanic, `prop.react`: `kick` (a bin, a cone, a can, a skull — a small
prop with `foot ≤ 0.3` and `react: 'kick'` is a body: the walker / the deck knocks it along their heading
with a hop and a clatter cue, it settles, the room remembers nothing — cosmetic, never a puzzle), `toggle`
(a light switch on a plan wall flips the room's `mood.ambient` between two values and the strips' emissive;
a TV / a monitor / a jukebox cycles its screen texture), `open` (a locker, a cabinet, a fridge: a leaf on a
hinge with the door kit's cue, nothing inside but a line), `sit` (`hqSit` exists — give the walker the
Sitting_Idle on every seat and a camera that settles), `read` (a plaque / a poster / a notice opens its
copy as a close-up card with the camera pushed onto it — the terminal's `focusScreen` push).

**5.3 Water that reacts.** Ripple rings at the walker's feet in a wade (`_hqTickSwim` knows the depth), a
splash on a plunge, the skiff's wake, the sea sheet's caustic web already flows.

**5.4 Glass and mirrors.** The barbershop's mirror, the observatory's dome, the mall's storefronts, a
puddle in the sewers: a `Reflector` plane (three r128 ships `THREE.Reflector`) at 1/4 resolution on
`shell.pbr` rooms only, at most one per room (`prop.reflect: true`). The puddles ARE the AAA tell of the
city at night.

**5.5 Decals.** Blood by the interrogation table, graffiti on the drain, oil on the garage floor, scorch
under a torch, wear on a threshold: `prop.decal: { key, w, h }` = a quad projected onto the ground under
the prop (the urban pack's `Decal*` sheets exist and are unused).

**5.6 The plate that reads at a distance.** Every door plate / prop label (`_hqPlateHtml`) fades with
distance and turns to face the eye — today they are CSS2D at one size; a plate 30 m away is as big as one
at 3 m. `HQ_PLATE_FADE = { near: 6, far: 18 }`, the CSS2D anchor scaled by the projected tile width (the
battle's side-plate rule).

## 6 · THE CAMERA + THE MOVE (feel) — delivery 5

**6.1 Head bob and lean.** The third-person boom takes a 2 cm bob at the stride (surface-keyed to the step
event), a lean into a carve on the deck, a shake on a landing scaled by the fall (`_hqRideCamDip` exists
for the rider — give the walker the same), a 0.8× FOV pull on the sprint.

**6.2 The transition is a shot.** A door walk-through is a 0.25 s fade-through-black today when cold;
make every door a CUT WITH MOTION — the boom keeps its yaw across the seam, the leaf's swing on the far
side is seen from inside (`_hqGoTo` lands facing away; keep the swing playing on arrival), the light
adapts (exposure eases from the old room's key to the new's over 0.6 s — `_expLk` already eases the two
brightnesses).

**6.3 Letterbox + a title card on a first arrival.** A room stood in for the first time (`hqRoomSee`
knows) gets a 2 s letterbox, its name in Cinzel at the foot, the bed fading in — the Souls / Zelda arrival.
`shell.arrival: false` opts out (corridors, lobbies).

**6.4 Motion blur on the deck and the fall** — a cheap radial / directional blur pass at speed > 8 m/s
(the retro pass's shader takes a `uVelocity`; a second-frame reprojection is not worth it).

## 7 · THE POST PASS (the grade) — delivery 6, with the user at the sliders

**7.1 Colour LUT per look.** `HQ_ROOM_LOOKS[x].lut` names a 16³ cube (a 256 × 16 PNG) applied in the
cinematic pass after tone mapping — the dream, amber, green, teal presets become REAL grades (teal-orange
for the city, bleach-bypass for the flightline, a lifted-black film stock for the woods) instead of a
tint + levels. Eight LUTs authored in a photo tool are the user's; the pass is one texture read.

**7.2 Bloom that reads as light, not haze.** The bloom threshold rides the look (`bloom.threshold`), so
only EMISSIVE surfaces bloom (the neon, the torches, the ley veins, the screens) and a white wall never
does; `bloom.radius` per look.

**7.3 Lens.** Chromatic aberration at the frame's edge (the cinematic pass has `uChromaShift` for the CRT
— give the look a `lens.chroma` for the plain cinematic), a lens-dirt bloom mask on the neon city and the
lava, an anamorphic streak on the lighthouse beam and the neon signs (the bloom pass with an x-stretched
kernel — a second UnrealBloom with `resolution.y` quartered).

**7.4 Auto exposure.** The eye ADAPTS: a 1 × 1 downsample of the frame's luminance eased over 1.5 s
drives `toneMappingExposure` ± 0.5 stop round the room's setting (the two brightnesses' `_expLk` is the
seat) — walking out of the tunnel into the flightline blinds for a beat, then settles. `EW_NO_AUTO_EXPOSURE`.

**7.5 TAA / SMAA over FXAA** on High (r128 ships `SMAAPass`); the sprite edges and the rails shimmer today.

## 8 · The order, the cost, the decisions

| # | Delivery | Files | Effort | Reads as |
|---|---|---|---|---|
| 1 | THE LIGHT PASS (2.1 · 2.3 · 2.5 first; 2.2 · 2.4 second) | three-renderer.js, three-post.js, data.js | 2 sessions | **the single biggest jump** — objects on the floor |
| 2 | THE SOUND PASS (4.1 · 4.2 · 4.3) | audio.js, three-renderer.js, map.js, the SFX pack | 1–2 sessions + the user's step / bed recordings | the second biggest, for a tenth of the GPU |
| 3 | THE AIR PASS (3.1 · 3.2 · 3.3, then 3.4) | three-renderer.js, three-post.js, data.js | 2 sessions | depth |
| 4 | THE PROP PASS (5.2 kick / read / sit first, 5.1, 5.5, 5.4 last) | three-renderer.js, data.js, map.js | 2–3 sessions | life |
| 5 | THE CAMERA + THE MOVE | three-renderer.js, map.js, styles-base.css | 1 session | feel |
| 6 | THE POST PASS (7.1 · 7.2 · 7.4; 7.3 / 7.5 by taste) | three-post.js, data.js, the LUT PNGs | 1 session + the user's LUTs | the grade |

Rules that hold across all six: every effect is a per-room DATA row (`shell.*`) with a default by room
kind, never code per room; every effect has a kill-switch and a `EW_PERF_LOW` tier; nothing touches
`state` or the relay (RULE #2 — the building is viewer-local; a battle-side item is named as such);
`node playtest_city.js <room>` (the real-sheet probe) photographs each pass before it is claimed; the
frame budget is 16 ms on a desktop in the cities WITH the population — measure `renderer.info` before and
after each delivery and write the numbers in §9.

**Decisions the user owns (answer in §9 or in chat):**
- D1 · Shadows on by default at which tier? (rec: High on desktop, Low under 60 fps, Off on the phone —
  the battle's existing knob.)
- D2 · PBR (2.4) for the whole building, or only the rooms with a look? (rec: start with the six hubs'
  anchor rooms + the hall; the rest inherit when the normal sheets are in the bucket.)
- D3 · SSAO (3.4): worth its cost, or does baked AO (2.3) + shadows carry it? (rec: build 2.3 first, then
  judge SSAO on the real frame rate in Disaster City.)
- D4 · The step / ambience recordings: the user's pack or a synthesised kit (the door kit's recipes could
  voice steps — thin, but free)?
- D5 · Reflectors (5.4): only puddles and the barbershop mirror, or the storefront glass too?
- D6 · Kickable props (5.2): purely cosmetic (rec), or do they settle and stay for the visit?
- D7 · The arrival card (6.3): every room once, or the hubs' anchors only?
- D8 · The LUTs (7.1): the user authors them, or Claude generates eight from the preset names?

## 9 · Build log

- 2026-09-21 (the second pass) — **THE AIR THINNED IN THE BUILDING + 2.2 · 5.1 · 5.3 · 5.5 · 6.2 · 7.3 · 7.5** (the user: "way
  too many ambient particles in DOOR HQ when those should be in more outdoor places like the woods; keep going; I don't have
  PBR maps"). Tested (`premium-polish.test.js`, 20 tests — the ripples run in a vm; `npm test` green), photographed nowhere
  (the CDN is unreachable from this sandbox — RULE #1c, the look is the user's). By section:
  - **3.3 THE TIERS** — `HQ_LIGHT_RULES.atmos` carries three densities: `facility` (0.05 / m², ≤ 40 — a few motes in the
    shafts of the hall, the cafeteria, an office), `closed` (a wild room under a ceiling: the crypt, the hold, the sewers —
    0.32 / m², ≤ 300) and `open` (the woods, the estate, the grounds — 0.95 / m², ≤ 720). data.js `hqRoomAtmos` names the
    tier (`a.tier`: no site → facility; a site's open shell → open; else closed) and `_hqBuildAtmos` reads it; a shell's own
    `atmos.n` still pins a count. The hall went from ~600 motes to ~40.
  - **2.2 THE HERO LIGHT** — `_hqHeroShadow` at the prop-light site: the FIRST warm prop light of a room whose key matches
    `HQ_LIGHT_RULES.shadows.hero.keys` (torch · brazier · campfire · furnace · hearth · forge · pyre · candelabra · lava)
    casts a 512² cube map (256 on Low; one per room — `H.heroLit`); `shell.mood.hero: false` opts a room out; off on the
    phone / with shadows off. The pulsed depth pass (`_hqShadowTick`) refreshes it with the key's map.
  - **5.1 THE WIND** — `_ewWindHook(mat, modelH, ampLocal)`: a crown-weighted sway in the vertex shader (two sines on the
    world position, `uEwWind` = the shared clock `_EW_WIND` the frame writes × `wind.speed`) on every HQ tree's leaf material
    (`wind.amp` 0.055 m at the crown) and bark (a third); `_nrTree` applies it under `K.hq && !K._wdFog` only (the battle's
    rim trees keep the world's fog / dissolve hooks). `EW_HQ_NO_WIND`. The foliage OBJs' `Tree_Leaves` mesh is the crown.
  - **5.3 THE RIPPLES** — `_hqRippleEmit` / `_hqTickRipples`: a pooled flat quad (one cached ring canvas) at the sheet's height
    every `ripples.every` s while the walker WADES (the feet under a terrain fluid / a site or cave fluid cell — never lava),
    while the swimmer moves on the surface, and behind the skiff's stern (`wakeR`); a PLUNGE (`_hqSwimStart`'s dive-at-once)
    is a SPLASH of `splashN` rings. `EW_HQ_NO_RIPPLES`. The vm test walks a wader through a stub pool.
  - **5.5 THE DECALS** — data.js `HQ_DECAL_RULES.byKey` (a scorch under every torch / brazier / furnace, oil under every car /
    truck / bus, blood by the steel and autopsy tables and the altar stones, grime under bins and barrels, a puddle at a
    drain / a vent) + `.door` (a WEAR patch 0.75 m inside every door's landing, indoors) + `DOOR_HQ.decals[room]` hand rows
    (the garage's oil, the interrogation room's blood, the sewers' and tunnels' puddles, the boiler's scorch, the pit's,
    the cellar's). `_hqBuildDecals` after the atmosphere: six painted canvases (`_hqDecalTex`) or an `urban:<Name>` sheet
    (`key`), a quad 2 cm over the ground (above the contact disc), refused on a slope (`_hqDecalGround`: a 0.3 m spread over
    the footprint), ≤ `decals.max` a room. `EW_HQ_NO_DECALS`.
  - **6.2 THE TRANSITION** — `_hqGoTo`: the door you came through stands OPEN on arrival and swings shut behind you
    (`openT` 1 + the rounds' `npcOpenUntil`; never a portal, a way or an unmeasured angle). The exposure already eased
    across the seam (`_expLk`); the boom's yaw is the door's facing as before.
  - **7.3 THE LENS** — a look's `lens: { chroma }` (px at the frame's edge) rides the cinematic pass's `uChromaRadial` under
    the spell grades AND under a bare frame (`_lkLensChroma`); the neon city 2.2, the Strip 1.6, the nightmare 3.0.
  - **7.5 SMAA** — index.html loads r128's SMAAShader + SMAAPass beside FXAA; three-post.js `setAA('off' | 'fxaa' | 'smaa')`
    / `getAA()` (localStorage `ew_aa`; the old `ew_fxaa` flag reads as fxaa / off and is kept in step; a desktop defaults to
    SMAA when the pass loaded, the phone to off); the FXAA row in Settings → Graphics is an Anti-aliasing segment group.
  - NOT built, and why: **2.4 PBR** — the user has no normal / roughness sheets (D2 closed: Phong stays); **3.4 SSAO** — D3
    still waits on the real frame rate in Disaster City with 2.1 + 2.3 + the hero light on; **5.2 read / toggle / open** —
    the props carry no copy / no second state yet; **5.4 reflectors**, **6.4 motion blur**, **7.1 LUTs** (D8, the user's
    PNGs), **§4 the sound pass** (the user's).
  - What to eyeball first: the hall with forty motes (too few → `atmos.facility.perM2`), the woods' crowns swaying (too much
    → `wind.amp`), the torch's cube shadow on the undercroft's walls (acne → `shadows.hero.bias`), the rings under the wader
    in the moat and the splash off a plunge, the oil on the garage's loop and the wear at every door (too dark → `decals.alpha`
    / `.wear`), the leaf closing behind you, SMAA on the rails and the sprites, the neon city's edge fringing.
- 2026-09-21 (later) — **DELIVERY 1 + 3 + 4 + 5 + 6 IN ONE PASS (the sound pass §4 skipped — the user's: "I'll do
  that later")**. Built, offline-photographed (`shots/polish/`, the scratch probe = playtest_hq_offline.js with the
  post ON — the notes in PLAYTEST_NOTES "THE POLISH PROBE"), tested (`premium-polish.test.js`, 14 tests; `npm test`
  green). What shipped, by section:
  - **2.1 THE SHADOW** — every room's key (`_hq.keyLight`, named by each `_hqEnter` light branch) casts ONE map
    (`_hqShadowArm`: the battle's Settings → Performance tier sizes it, `HQ_LIGHT_RULES.shadows`; the ortho frustum is
    fitted to the room but never wider than 30 m — it FOLLOWS the walker, snapped to its texel grid, `_hqShadowTick`;
    the depth pass pulses every `everyN` frames since `renderer.shadowMap.autoUpdate` is off for the battle's gate).
    Casters: props, doors, people (once their rig lands, `_hqTickChars`), the shell's floors and slabs; never a wall /
    ceiling / edge / strip part, the drum, the dome, the ground planes (`_hqShadowFlags`). Measured offline: the
    cafeteria's tables, bins and door frames cast onto the floor and the walls; the basilica's candles cast long.
    `EW_HQ_NO_SHADOWS`. 2.2 (a point-light shadow for a hero light) NOT built — a cube map is six passes; judge 2.1 live first.
  - **2.3 THE AO** — three layers: THE ROOM-BOX AO (`_hqAoHook` on `_hqMat` + `_hqPropMatPick`: the fragment's world
    position against the room's box — a floor darkens toward the walls, a wall toward the floor / ceiling / its
    neighbours, every PROP's vertical face darkens in the half metre over the floor; a face's own plane never occludes it;
    `_hqAoArm` per room: a closed box its walls + ceiling, an open / polar room the floor contact, a field nothing),
    THE CONTACT DISC (`_hqContactDisc` under every floor prop's foot — the battle's `shadowProxy` rule), THE TERRAIN AO
    (`aAO` baked from the sampled field's Laplacian + the foot of a plan's solid, multiplied in `_hqTerrainMat`; the
    outer ground carries the attribute at 1 — a missing attribute reads 0 = black). 2.4 PBR NOT built (D2: the normal
    sheets are the user's to put in the bucket first).
  - **2.5 THE RIG** — `HQ_LIGHT_RULES.key[kind]` (az / el / colour / intensity per box · open · bay · hall),
    `shell.rig` overrides (`_hqLightArm`). No room carries one yet — the table is the edit.
  - **3.1 THE HEIGHT FOG** — three's fog chunks patched ONCE at load (`_ewHeightFogPatch`: `fogDepth` is r128's name)
    with a shared plain-object uniform `uEwHFog` on every fogged ShaderLib entry (cloneUniforms copies a plain object by
    reference); `_hqHeightFogArm` per room (`HQ_LIGHT_RULES.heightFog[kind]`, `sky.fog.height`, `shell.heightFog`);
    zeroed by `_hqLeave` / `_menuEnter` (the battle sees the stock fog exactly). `EW_HQ_NO_HEIGHT_FOG`.
  - **3.2 THE LIGHT SHAFTS** — `_hqLightShaft` = the battle's god-ray kit (prism + pool + motes) as one beam;
    `DOOR_HQ.lightShafts[room]` rows in thirteen rooms (the basilica's west windows, Camelot's hall, the temple, the
    warehouse, the garage's core, the observatory's slit, the dream lab, the well shaft, the mall's atrium, the
    catacombs' grating, the archive's stacks, the elevator's shaft window); the proc `light_shaft` for a catalogue row.
    `HQ_SHAFT_GAIN` 2.2 over the battle's intensity. `EW_HQ_NO_SHAFTS`. MEASURED: the prism did not draw at first — the
    ray shader's radial term reads `vLocal.xz = position / uW`, so with uW = the box's own width every FACE sits at r ≥ 1
    and is discarded (the battle's shafts carry the same arithmetic: a pool + motes is what the board has always drawn —
    worth a look there next). The beam's `uW` is the width × `HQ_SHAFT_UW` (2.6); photographed in the basilica's nave:
    three beams from the west windows, their pools on the floor.
  - **3.3 THE ATMOSPHERE** — `_hqBuildAtmos`: one Points (LineSegments for rain) per room, ≤ 600, halved on the phone;
    the kind from data.js `hqRoomAtmos` (`shell.atmos` → `HQ_ATMOS_SITES[site]` → the rule by kind); eight kinds in
    `HQ_ATMOS_KINDS` (dust · motes · spores · fireflies · embers (off the warm lights) · snow · ash · rain). Photographed:
    the cafeteria's dust, the basilica's dust. `EW_HQ_NO_ATMOS`. 3.4 SSAO NOT built (D3: judge on the real frame rate
    after 2.1 + 2.3 — the plan's own recommendation). 3.5 THE FAR END is a data rule now (`hqRoomFogHalfAt`; four
    corridor rooms' densities raised; the test judges every halls / ley / city plan).
  - **5.1 THE SWAY** — catalogue `sway: { amp, period }` (seven hanging rows) → a damped spring on a top pivot with
    the room's draught + the walker's wake (`_hqSwayArm` / `_hqTickSways`). Foliage wind NOT built.
  - **5.2 THE KICK** — `HQ_KICKABLE` (twelve small props) are BODIES: no blocker, knocked along the walker's heading
    with a hop, roll out, bounce off the walls, settle; the disc follows flat (`_hqTickKicks`; a vm test + measured
    live offline: the cafeteria's bin rolled 1.7 m). Cosmetic (D6). **THE SEAT** — catalogue `seat` (seventeen rows) → E
    sits (the library's Sitting_Idle, the seat's front, the head lower), any key stands (`_hqSit`). `read` / `toggle` /
    `open` NOT built (the props carry no copy yet). 5.3 ripples, 5.4 reflectors, 5.5 decals NOT built.
  - **5.6 THE PLATE** — `HQ_PLATE_FADE` + the CSS var `--pk` (`_hqPlateDist`): a plate fades 8 → 20 m and shrinks past
    3.4 m (styles-base.css sizes the type in em).
  - **6.1 THE CAMERA FEEL** — `_hqCamFeel` after the eased boom: the stride bob (7.6 / 11.5 Hz), the landing shake by
    the fall, the sprint lens 52 → 58, the roll into the rider's carve. `EW_HQ_NO_CAM_FEEL`. 6.4 motion blur NOT built.
  - **6.3 THE ARRIVAL CARD** — a room's FIRST sighting (`hqRoomSee`, `hqRoomArrival`: numbered rooms, every part of a
    site, the hub anchors; never a lobby / corridor / the car / the foyer) → the letterbox + the number + the name in
    Cinzel + where (map.js `_hqArrivalQueue` / `_hqArrivalFire`, after the load card hides; `#hqArrival`). D7 = every
    place once.
  - **7.2 / 7.4 THE POST** — the building's bloom threshold 0.86 (a look's `bloomThr` / `bloomRadius`: the neon looks
    0.58 / 0.6) so only emissive surfaces bloom; THE AUTO EXPOSURE (three-post.js `_aeMeasure`: a 16 × 16 downsample of
    the frame every 220 ms, a centre-weighted luminance → a gain 0.78 … 1.32 eased over ~1.2 s, in `_expLk` while the
    context is the building's). `EW_NO_AUTO_EXPOSURE` / localStorage `ew_auto_exposure = 'off'`. 7.1 LUTs (D8 — the
    user's), 7.3 lens, 7.5 SMAA NOT built.
  - Frame cost, measured offline (swiftshader, meaningless for fps; `renderer.info` after the frame): the depth pass adds
    one caster draw every other frame; the atmosphere one draw; a beam three. The real frame rate in the cities is the
    user's to read (D1: shadows default ON at the battle's tier — the same knob turns them off).
- 2026-09-21 — the plan written; nothing built. The survey numbers in §0 are read off the source
  (three-renderer.js's `_hqEnter` light block, `_hqMat`, three-post.js's composer, audio.js's beds).
