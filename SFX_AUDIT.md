# Entropy Wars — SFX Audit & Sound Design Roadmap

*Generated 2026-08-03. Cross-references the 37-key SFX registry (audio.js) against 442
spells (data.js), 609 visual effects (three-vfx-effects.js), the lightning renderer
(three-lightning.js), 10 weather systems, the destruction/physics layer, and every
playSfx call site in battle.js/ui.js/state.js.*

**Spec format:** every entry gives — what it should sound like (with layer recipe),
how long, and where it hooks in. Layering is assumed throughout: almost every impact
is TRANSIENT (attack, 0–80ms) + BODY (character, 100–400ms) + TAIL (space/decay).
Deliver everything as .ogg, mono for point sounds, stereo only for ambience/stingers.

**Duration house rules**
| Class | Length |
|---|---|
| UI ticks | 40–120ms |
| Launch/cast whooshes | 250–500ms |
| Impacts | 300–700ms (tail can ring to 1.2s) |
| Ultimates / signature moments | 1.0–2.5s |
| Stingers (weather, zodiac, combo) | 1.5–3s |
| Ambience loops | 8–20s, seamless loop points, no obvious repeating event in the loop |

---

## 0. BUGS TO FIX FIRST (free wins, no new assets needed... mostly)

1. **`uiBack` is called 14 times but never registered** — every "cancel/back" in the
   battle action menu is silent. Need: soft reversed-envelope blip, slightly lower
   pitch than uiConfirm (a "step down"). ~80ms. Register in `_R2_SFX`/`_LOCAL_SFX`/
   `SFX_BASE_VOLUMES`.
2. **`arrowShot` called at three-vfx-effects.js:11394, never registered.** Bowstring
   release: string "thwip" transient + short fletching whoosh. ~250ms.
3. ~~`death` never played in battle~~ — **CORRECTION**: `defeatUnit()` (map.js:6890,
   called from battle.js:16964 on every kill) already plays `death`. Not a bug.
   A distinct `killingBlow` cinematic layer (§2) is still worth adding on top.
4. **The per-spell `sfxCues` system already exists** (battle.js:5122, authorable in
   the Spell Lab timeline) **but zero spells use it.** This is the delivery vehicle
   for everything in §1 — no new engine code needed for per-spell sounds.
5. **`explosion` on delayed-spell detonation is gated inside `if (window.ThreeVFXEffects)`**
   (state.js:916) — decouple sound from VFX availability.
6. **No spatialization at all.** Add a cheap `StereoPannerNode` pan from tile-x vs
   camera center, and −3 to −6dB for off-screen events. Transforms the whole mix for
   near-zero asset cost.
7. **Global throttle = 6 sounds/200ms** (audio.js:469). Add a priority tier so big
   moments (death, ultimate impacts, weather strikes) can't be dropped by footsteps.

---

## 1. ELEMENTAL SPELL LAYER — the single biggest gap

`spellLaunchSfx()` (battle.js:40444) routes **every non-gun magic spell in the game
to `fireball`**, and every magic impact to the one `spellDamage` clip. Ice, lightning,
holy, void, poison — all identical. Fix: an element→SFX map keyed off the
`_STAGE_ARCHETYPES` themes already used for visuals, with launch+impact pairs.

Each element needs at minimum: **cast/launch** (~300–450ms) and **impact** (~400–700ms).
Spell counts show how much mileage each pair gets.

### ⚡ Lightning / Electric (11 spells + thunderstorm weather + conduction arcs) — YOUR CALLOUT, and deservedly so
The game has a dedicated MeshLine bolt renderer (three-lightning.js) with sky strikes,
chain hops, and conduction arcs through water/metal — all fully silent today.

| Key | Sounds like | Layers | Length |
|---|---|---|---|
| `elecCast` | rising electric charge | static crackle bed + rising sine sweep + arc snaps | 400ms |
| `lightningStrike` | close lightning hit | white-noise CRACK transient + deep 60–120Hz thump + sizzle decay | 700ms |
| `thunderRumble` | delayed distant thunder | low rumble, band-limited noise, slow attack | 2–3s, play 300–800ms AFTER strike for distance realism |
| `chainHop` | bolt jumping targets | short "bzzt" zap, pitch up per hop (play at each `chain_hop`) | 150ms |
| `conductionArc` | current through water/metal | fizzing arc sweep, watery filter for pools / metallic ring for steel | 400ms per hop (hooks `_conductionArcVfx`, battle.js:2525) |
| `empBurst` | tech-killer pulse | sub drop ("bwomp") + fizzing detune tail + electronics dying (falling beeps) | 900ms |
| `taserZap` | small stun jolt | rapid tick-tick-tick arc burst | 300ms |
| `teslaIdle` | coil idle | humming 50Hz + intermittent arc snaps | 8s loop (Tesla Coil deployable) |

### 🔥 Fire (19 spells) — partially covered
`fireball` and `burningDamage` exist. Add:
- `flameJet` — directional roar for line spells (Hellmouth, Dragonfire, Atomic Breath): ignition WHUMP + sustained rushing roar. 800ms–1.2s.
- `fireImpact` — dedicated impact (whoosh-boom + crackle tail) so launch and hit stop sharing one clip. 500ms.
- `lavaBubble` — thick bubbling loop for lava tiles (visuals already pulse via `_updateLavaEmissive`). 10s loop.

### 🧊 Ice / Frost (12 spells)
- `iceCast` — crystalline shimmer, glassy high partials + cold airy whoosh. 400ms.
- `iceImpact` — glass-shatter transient + frozen "kssh" + brittle tinkle tail. 500ms.
- `freezeSolid` — for Flash Freeze / frozen status: creaking ice growing, ending in a deep "clunk" lock. 700ms.
- `iceSlide` — sliding scrape loop for `slide:true` ice tiles. 600ms per slide.

### 🌊 Water / Tidal (23 spells)
- `waterCast` — gathering water swell (reversed splash). 400ms.
- `waterImpact` — heavy splash + droplet spatter tail. 500ms. (Distinct from existing `drowningDamage` which stays for the DOT.)
- `tidalWave` — for Great Flood / Tidal Surge beams: wall of water, deep whoosh + white-water hiss. 1.2s.
- `whirlpool` — swirling loop for aoePull duration. 2s loop.

### 🪨 Earth / Rock / Quake (27 spells)
- `earthCast` — grinding stone charge + gravel shift. 400ms.
- `earthImpact` — boulder THUD, sub-heavy + rock-debris scatter tail. 600ms.
- `quakeRumble` — sustained ground-shake rumble + cracking stone, for Quake/Tremor Stomp/earthquake weather. 1.5s.
- `stoneRise` — for terrainCreate walls (Rampart family, 16 terrainCreate spells): rock grinding upward + settling thump. 800ms, syncs with wall-rise animation.

### 🌪 Wind / Gravity / Aerial (18 spells)
- `windGust` — sharp air blast for Wing Gust / Shockwave Clap. 500ms.
- `gravityWell` — pitch-bending suction, reversed-cymbal-like inhale (also serves Black Hole, Vortex Slam, all 5 aoePull spells). 900ms.
- `sonicBoom` — crack + rolling boom, for Sonic Breaker/Boomerang and `sigSonicBoom3D`. 800ms.

### ☠️ Poison / Acid (13 spells) — `poisonDamage` DOT tick exists
- `poisonCast` — bubbling gurgle + hiss. 400ms.
- `acidImpact` — corrosive sizzle, frying-pan hiss + material dissolving. 600ms.
- `gasCloud` — soft toxic hiss loop for Plaguefield / Exhaust Cloud / Smoke Screen zones. 8s loop (hook `_tickPersistentZones`).

### ✨ Holy / Divine (26 spells)
- `holyCast` — choir-pad swell + soft bell. 500ms.
- `holyImpact` — bright bell strike + shimmering angelic tail ("light piercing down"). 700ms.
- `judgmentDescent` — for the 19 `descent`-channel sky spells (Judgment, Divine Judgment, Wrath of the Watchers): rising heavenly drone during telegraph, cut by the impact. 1.2s.
- `reviveSfx` — soul returning: reversed shimmer into warm major chime. 1.2s. (Revive is fully silent today.)

### 🌑 Dark / Void / Unholy (37 spells — largest themed group)
- `darkCast` — low whispering drone + subharmonic swell. 500ms.
- `darkImpact` — hollow BOOM with reversed pre-suck (void collapse) + whisper tail. 600ms.
- `curseApply` — for the mark/hex/contract cluster: dissonant bell + murmured-whisper texture. 700ms.
- `soulDrain` — for the 11 drainHop spells: ghostly inhale sweeping from target to caster, pitch rising as the orb travels. 700ms, timed to the drainHop VFX flight.

### 🩸 Blood (9 spells + bloodRain weather)
- `bloodImpact` — wet visceral splat + dripping tail. 400ms.
- `bloodRitual` — heartbeat (60–70bpm, two beats) + wet ambience. 1.2s.

### 🧠 Psychic / Mind (23 spells)
- `psychicCast` — detuned sine shimmer, slight ring-mod warble. 400ms.
- `psychicImpact` — "mind crack": filtered sweep + glass-crack + tinnitus ring fading. 700ms.
- `hypnosis` — for charm/sleep/brainwash cluster: slow wobbling theremin-like tone. 900ms.

### 🔊 Sonic / Voice (28 spells — Roars, Howls, Siren Song, Lullaby, Encore…)
These are literally sound-themed spells that currently play `fireball`. Highest
comedy-of-errors factor in the game.
- `roar` — beastly layered roar (lion + pitched-down human), chest-heavy. 900ms.
- `howl` — wolf howl with light reverb. 1.2s.
- `sirenSong` — haunting 3-note female vocal phrase, watery reverb. 1.5s.
- `lullaby` — music-box 4-note phrase, detuned/dreamy. 1.5s.
- `warCryShout` — group battle shout + snare-hit accent (serves all 10 warCry spells). 800ms.
- `encoreSting` — quick orchestral flourish. 700ms.

### 🔫 Tech / Laser (66 spells — guns already well covered)
`gun`, `doubleShot`, `shootout`, `turret`, `jetFlyover`, `nukeAlarm`, `explosion` exist. Add:
- `laserBeam` — sustained coherent-light hum + hot sizzle at contact, for the 20 beam-channel spells. 800ms (or loop while beam is live).
- `plasmaShot` — "pew" with body: sci-fi discharge + doppler tail. 300ms.
- `railgunShot` — capacitor whine-up (200ms) + supersonic CRACK + metallic ring. 900ms.
- `missileLoop` — whistling rocket loop during travel + existing `explosion` on hit. 1–2s loop (Missile Barrage, Mortar Salvo descents).
- `roboServo` — hydraulic servo movement for mech attacks (Robo Punch, Hydraulic Crush). 300ms.
- `glitchSfx` — bit-crushed digital stutter/tear for Crash Loop, Blue Screen, glitch race. 400ms.

### 👽 Alien (abduction/UFO cluster)
- `ufoHum` — wobbling theremin saucer loop. 8s loop (`sigUFO3D`, War of the Worlds).
- `tractorBeam` — rising harmonic drone while the beam column lifts (hooks `raceTractorBeam_column/_step/_arrive`). 1.5s.

### 🥋 Ki / Martial (8 spells)
- `kiCharge` — DBZ-style rising energy tremolo + wind rush. 900ms loop-able (also pairs with the unit power-aura visual, which has lightning crackle and no sound).
- `kiBlast` — punchy energy release, "HA" air burst + beam hum tail. 500ms.

### 🌿 Nature / Seed (seeds, Overgrowth, Wild Growth)
- `plantGrow` — creaking vine stretch + leaves rustle. 600ms.
- `seedPlant` — soft soil "poomf". 250ms.

### 🔮 Arcane / Anomaly (21 arcane + reality-warp cluster)
- `arcaneCast` — glassy synth arpeggio sparkle. 400ms.
- `arcaneImpact` — prismatic "ping-boom": bell transient + phasey sweep tail. 600ms.
- `realityWarp` — for Trick Room / Reality Pulse / Temporal Shift / Time Rewind: tape-stop pitch drop, then reversed tape-start. 1.2s.

---

## 2. COMBAT FEEL LAYER (game-juice sounds every tactics AAA has)

| Key | Trigger (verified silent today) | Sounds like | Length |
|---|---|---|---|
| `unitDeath` | covered — `defeatUnit()` plays `death` on every kill (see §0.3) | consider per-faction variants later | — |
| `killingBlow` | `_blood_killing_blow` tier | slow-mo whoosh into deep sub-slam + brief total silence after (duck music 300ms) | 1.2s |
| `critHit` | battle.js:16756 crit branch | layer ON TOP of normal impact: extra sharp transient + metallic ring + tiny pitch-up zing | 400ms |
| `superEffective` | battle.js:16829 | bright affirming "shing" layer over impact (Pokémon-style) | 350ms |
| `notEffective` | resist branch | dull thud, low-passed, almost comically muted | 300ms |
| `missWhiff` | MISS float, battle.js:10347 | air whoosh, no contact, slight downward pitch | 300ms |
| `shieldBreak` | shield HP reaches 0 (battle.js:14172/43138 — no break event exists yet, add one) | glass/energy shatter + descending debris sparkle | 600ms |
| `comboIgnite` | doComboAttack (fully silent) | two-stage: rising dual-tone charge (both casters) then unified slam; per the 20 named COMBO_REGISTRY pairs, one shared ignite + reuse elemental impact tails | 1.5s |
| `stunApply` | stun/frozen/sleep application (all share `debuff` today) | dizzy descending warble + "clonk" | 500ms |
| `silenceApply` | silence/jammed | vacuum "shhp" — sound getting sucked out, brief high-pass on music would sell it | 400ms |
| `rootSnare` | root/snare/web | ropes/vines cinching tight, creak + snap taut | 400ms |
| `wetApply` | Soaked status (the lightning-combo enabler) | drenching splash + drip | 400ms |
| `guardBlock` | exists (`block`) — fine | — | — |

---

## 3. PHYSICS & DESTRUCTION (BREACH/COLLISION/MAT_DROP configs — all silent)

The game has a full destruction engine: 4 material hardness tiers, pool-ball unit
collisions with chain knock-ons, debris cubes that scatter and bank, voxel
build/dig. None of it makes a sound.

| Key | Sounds like | Length |
|---|---|---|
| `breakBrittle` (wood/ice/crystal) | dry crack-splinter + light debris | 500ms |
| `breakEarth` (packed earth) | crumbling dirt collapse, soft and heavy | 600ms |
| `breakMasonry` (stone) | grinding crack + rock rubble avalanche | 700ms |
| `breakPlate` (metal) | tortured metal shriek + clang + bolt-pops | 700ms |
| `wallSlam` | unit thrown into wall: meaty thud + wall-material rattle | 400ms |
| `unitCollide` | bowling-pin unit crash: double body-thud, chain plays it again per victim, pitch-varied | 350ms |
| `debrisScatter` | cubes bouncing: 2–3 clacks, randomized | 400ms |
| `debrisBank` | walking over a pile: pickup "chk-ching" (item-get adjacent) | 300ms |
| `buildPlace` ×3 | per BUILD_MATERIALS: timber knock / stone clunk / steel clang | 300ms each |
| `digBlock` | shovel-crunch + block pop-out | 400ms |
| `reshapeRaise` / `reshapeLower` | replaces the current wrong `physicalAbility`: sub-bass earth groan rising (raise) / falling (lower) + gravel | 700ms |
| `fallImpact` | fall damage (silent): whistling drop (if ≥2 levels) + hard body slam + dust | 600ms |
| `landSoft` | any jump/drop landing without damage: foley thump scaled to height | 200ms |

---

## 4. MOVEMENT & FOOTSTEPS

One `moveStep` clip currently covers 160 terrain types. AAA move: **footstep material
families**, 3–4 round-robin variants each, ±2 semitone random pitch. ~150ms per step.

Priority families (by map frequency): `grass` (soft rustle-thud), `stone/brick/marble`
(hard tap), `dirt/sand` (gritty scuff), `wood` (hollow knock), `metal` (plate clank),
`water-shallow` (splash-step), `swamp/bog` (sucking squelch), `ice` (glassy tap +
occasional slip-scrape), `glass` (crunch), `carpet/organic` (muffled), `rubble` (loose
rock shift), `snow` (crunch — blizzard converts terrain to ice/snow trails).

Also:
- `wingFlap` — flying unit movement (SKY_RACES): leathery or feathered per-step flap instead of footsteps. 250ms.
- `hoverLoop` — mech/orb/AI flyers: soft anti-grav hum while airborne. 6s loop, very quiet.
- `batTransform` — vampire takeoff/landing morph (silent today): flurry of wings + squeaks. 700ms.
- `dashWhoosh` — the 13 dash spells: sharp air rip with doppler. 400ms.
- `leapRise` + use existing land sounds — strike-leap animation (7 leapStrike spells): crouch-spring "hup" whoosh up. 300ms.
- `teleportArrive` — `teleport` exists but plays once; the VFX has vanish→dispersal→arrival. Add a distinct arrival "pop" (reverse of the vanish). 300ms.

---

## 5. WEATHER & AMBIENCE — your second callout; currently ZERO non-music audio

There is no ambient audio system at all: no loops, no weather sound, nothing. This is
the biggest "sonic fullness" multiplier in the whole audit. Two-part fix:

### 5a. Weather (10 types in WEATHER_REGISTRY)
Pattern per weather: **onset stinger** (1.5–2.5s, plays with the spawn announcement +
camera pan — the hook already exists at `queueAnnouncement(..., 'weather')`),
**bed loop** (10–20s seamless, ducked −6dB under music), **end fade** (2s).

| Weather | Onset stinger | Bed loop | Event one-shots |
|---|---|---|---|
| Thunderstorm | distant rolling thunder + rain fade-in | steady rain + occasional distant rumbles baked in | `lightningStrike`+`thunderRumble` per unit hit (§1) |
| Blizzard | icy wind howl rising | whistling wind + snow hiss | freeze crackle when it converts terrain to ice |
| Sandstorm | gritty wind blast | abrasive granular wind, band-passed | sand-scour "shhk" on damage tick |
| Tornado | freight-train roar approaching (pan it!) | churning roar loop, volume scales with distance to camera | debris-whip crack on displace |
| Hurricane | storm surge + heavy rain slam | wind + driving rain, deeper than thunderstorm | wave-crash on displace |
| Blood Rain | unsettling reversed choir + thick droplets | viscous rain (lower, thicker than water rain) + faint heartbeat | sizzle (burns Divine) / dark shimmer (heals Unholy) |
| Earthquake | (instant one-shot weather) `quakeRumble` big version: 2.5s rumble + cracking + debris | — | — |
| Solar Flare | searing bright drone swell | high shimmer-heat air, crackling radiation | scorch hiss on Tech units |
| Tesseract Storm | crystalline digital chime cascade | glassy geometric pings over a hollow synth pad | "tink" shard impacts |
| Drought | dry wind + insect drone swell | sparse hot wind, distant cicadas | — |

### 5b. General ambience beds (the "alive world" layer)
Hook: day/night already exists (`document.body.dataset.cycle` drives fireflies).
- `ambDay` — light breeze + songbirds + insect bed. 20s loop.
- `ambNight` — crickets + occasional owl + lower wind (pairs with the firefly visuals). 20s loop.
- `ambWindHigh` — for sky/cloud maps: thin altitude wind. 15s loop.
- `ambCavern` — for cave/underground nexus maps: drips + hollow room tone. 20s loop.
- `ambCosmic` — for moon/mars/void map environments: deep space drone, sub-heavy, near-subliminal. 20s loop.
- Map-env selection can key off `state.mapEnv` (already drives the sky dome).

### 5c. Point-source ambient loops (quiet, gated by camera proximity if panning lands)
- `torchCrackle` — torches/braziers (visual flame flicker exists). 8s loop.
- `waterLap` — water tile clusters / waterfalls (`_waterfallTexList` visuals exist — waterfall wants its own `waterfallRush` 10s loop). 10s loop.
- `lavaBubble` — §1 fire. |
- `nexusHum` — the 3 nexus objectives: mystical harmonic drone; add `nexusChannelTick` (soft rising ticks while capturing — the channel VFX exists per player). 10s loop + 200ms ticks.
- `turretIdle` — deployed turrets: servo scan whir. 6s loop.
- `teslaIdle`, `ufoHum` — §1.
- `portalLoop` — Grave Passage / Tunnel Network pairs: airy whoosh vortex. 8s loop.
- `fiveGHum` — 5G Tower: sterile electrical hum + data chirps. 8s loop.

### 5d. Sky events & zodiac (cinematics exist, fully silent)
- `zodiacShift` — plays under the ~3.6s `playZodiacReveal` sky cinematic: deep cosmic swell + constellation "draw" sparkle glissando. 3.5s, one-shot.
- `bloodMoonRise` / `eclipseBegin` — sky-event onset: ominous low choir swell (blood moon), airy vacuum + corona shimmer (eclipses). 2.5s. Separate short **end** sting (1s) — the code has distinct `banner-sky-end` states.

---

## 6. DEPLOYABLES, OBJECTS, PROJECTILES

- `deployThump` — generic deployable placement (turrets have `turret`; the 8 deployObject spells share nothing): materialize shimmer + weighty ground thump. 400ms.
- `turretDestroyed` — turret/tower death (silent today; `turret` only covers deploy+fire): metal collapse + electrical fizz-out. 700ms.
- `mineArm` — Flashbang Mine armed: two rising beeps. 300ms. `flashbangPop` — sharp CRACK + ringing whine tail (high-pass sweep). 900ms.
- `kegFuse` — powder keg lit (detonate currently plays `uiConfirm`!): sputtering fuse hiss loop until blast (existing `explosion` covers the boom; chain explosions re-trigger with ±3 semitone variance). 1–2s loop.
- `mirrorChime` — Prism Mirror placed / beam redirected: crystalline ping. 300ms.
- `cloneBubble` — Cloning Machine / Mitosis: wet sci-fi gloop + pop. 600ms.
- `arrowShot` — §0.2. `arrowImpact` — thunk (flesh) / crack (stone). 200ms.
- `bowVolley` — Arrow Rain / Bullet Rain: massed whistling descent + multi-thunk scatter. 1.2s.
- `itemThrow` exists; add `baneShatter` — the 6 Bane bottles + grenade share the throw, each impact gets a glass-shatter + short per-faction tail (6 tails, 300ms each, layered on one shatter).

---

## 7. CINEMATICS, UI, META (mode-aware)

- `matchStartSlam` — battle-start slam/letterbox: braaam-lite orchestral hit + sub drop. 1.5s.
- `vsSplash` — VS screen: dual whoosh-clash. 1s.
- `suddenDeath` — TDM tie-breaker: alarm-tinged dramatic sting. 2s.
- `turnBanner` — player/enemy turn announce (silent; only hourglasses have sounds): short faction-flavored whoosh-chime, two variants (yours = bright, enemy = dark). 500ms.
- `roundTick` — last-3-seconds turn clock: clock tick + final tock. 150ms each.
- `dominationScore` — hotspot/domination point scored (silent; only nexusCaptured exists): territorial horn blip. 500ms.
- `gauntletSwitch` — gauntlet reserve switch-in: tag-team whoosh + tag slap. 400ms.
- `placementPut` / `placementLock` — placement phase (silent): soft piece-place + confirm chord. 200/400ms.
- `actionCamWhoosh` — kill-cam / offensive action camera move: subtle cinematic air sweep. 400ms, very quiet.
- `levelUp`, `victory`, `defeat`, hourglasses — already covered.
- `sfxCues` Spell Lab preview already supports auditioning — use it as the mixing bench.

---

## 8. SYSTEM RECOMMENDATIONS (engine work, ordered by value)

1. **Element routing map** in `spellLaunchSfx()` + impact router (battle.js:16783):
   `ARCHETYPE_SFX = { lightning: {launch:'elecCast', impact:'lightningStrike'}, ... }`
   keyed by the same archetype resolution the VFX stage system uses. One table
   upgrades ~400 spells at once; `sfxCues` then overrides per-spell for signatures.
2. **Ambience bus**: a second looping-audio channel set (like music but for beds),
   with its own volume slider, crossfade on weather/map change, and duck-under-music
   at −6dB. Weather beds + day/night beds ride it.
3. **Stereo panning + distance volume** (§0.6).
4. **Variation pools**: for any key that fires >5×/minute (footsteps, impacts, UI),
   register arrays (`moveStep_1..4`) with random pick + ±1–2 semitone `playbackRate`
   jitter. Kills repetition fatigue — the #1 tell of non-AAA audio.
5. **Music ducking**: −4dB music dip for 500ms on killingBlow/ultimate impacts;
   brief high-pass on `silenceApply`.
6. **Priority tiers** in the throttle (§0.7): `critical` (death, ultimates, weather
   strikes) > `normal` (impacts, casts) > `cosmetic` (footsteps, UI ticks) — drop
   cosmetic first.

---

## Asset count summary

| Tier | What | ~New clips |
|---|---|---|
| **P0** | Bug fixes (uiBack, arrowShot — DONE 2026-08-03, aliased to existing clips) + element launch/impact pairs for lightning, ice, holy, dark, sonic, psychic, water, earth | ~35 |
| **P1** | Combat feel (crit, super-effective, miss, shield break, combo, statuses) + weather onsets/beds | ~40 |
| **P2** | Destruction/physics + footstep families + ambience beds + point loops | ~50 |
| **P3** | Remaining elements, deployables, cinematic/meta, variation pools | ~50 |

Total to "sonically full AAA": **~175 clips** (many are 150–500ms). The engine work
is small because `sfxCues`, the archetype system, and the announcement/camera hooks
already exist — this is overwhelmingly an asset-production job with a thin routing
layer on top.
