# Spell Cinematics — Signature Camera / Animation / VFX Candidates

> **STATUS (2026-08-10): v1 SHIPPED.** The primitive layer, the Void Stage
> (16 palettes), the named shot library, the family treatments for every
> `kind`, and 77 bespoke sequences (the named candidates plus the honorable
> mentions) are implemented in
> `battle.js` / `three-renderer.js` / `online.js` / `state.js` /
> `styles-cinematic.css`. See PLAYTEST_NOTES.md "SPELL CINEMATICS v1" for the
> wiring. What is still open is art-dependent: new props, new animation clips,
> reversed-clip playback, and the tile-by-tile terrain builds. Entries marked
> `[NEW: …]` below are all built except where that note says otherwise.

Entropy Wars has 445 spells and race abilities, and nearly all of them fire
through the same generic pipeline: two-beat OTS action shot, a `cast*` clip,
a particle burst from `three-vfx-effects.js`. That pipeline is *good* — but it
makes a High Noon duel feel identical to a Poison Dart. This doc:

1. Specs the fully-designed **Boo** sequence (the flagship).
2. Lists **70 named spells** that earn a bespoke sequence.
3. Defines **family treatments** that cover the OTHER ~375 spells by kind, so
   every spell in the game gets *some* personality without 445 one-off builds.
4. Specs the **Void Stage** system — the "everything disappears except the
   actors" dramatic isolation shot (the Blue Screen idea, generalized into a
   reusable palette system).
5. Fixes the **beam problem**: line spells currently fire caster→target along
   the camera axis, so the beam foreshortens into a dot and you never see it.
   Beams get their own camera grammar.

Everything builds on primitives that already exist in `battle.js` /
`three-camera.js` / `sprites.js`. Where a NEW primitive is needed it's tagged
`[NEW: …]` so the engine work can be sequenced (each new primitive unlocks
many entries).

---

## Camera vocabulary (existing primitives)

| Name | What it is | Where |
|---|---|---|
| **OTS two-beat** | Cast close-up on caster → reverse cut framing the victim (`CINE_FACE_*` / `CINE_HIT_*`) | `_playCineActionShot`, battle.js |
| **Side profile** | Point-blank perpendicular shot, both actors in frame | `CINE_SIDE_SHOT_MAX_TILES` path |
| **TPS anchor** | True third-person pivot at a unit's real shoulder height, terrain-colliding boom | `_cineTpsAnchor` |
| **Charger** | Letterbox bars + spell-name banner over a wind-up | `ews-*` classes, cinematic charger |
| **Hard cut** | One-frame cut to a new framing, no tween | `_cineHardCut` |
| **Beat move** | Mid-shot camera glide that doesn't cancel the restore timer | `_cineBeatMove` |
| **Descent cam** | Sky-fall tracking shot (meteor / nuke payloads) | descent system |
| **Chase cam** | Low cam that runs alongside a dash | `animateDashActionCamera` |
| **Fog gate** | Never frame what the viewer can't see | `_shouldCameraFollowUnit` / `_isTileVisibleToViewer` |

## Named TPS shot library (the XCOM layer)

The `_cineTpsAnchor` rig already does true third-person: shoulder-height
pivot, terrain-colliding boom, past-horizon tilt. What's missing is a **shot
vocabulary built on it** — XCOM-style named framings that families and spells
reference by name instead of hand-rolled yaw/tilt math each time. Build these
as a data table (`CINE_SHOTS`), each entry = anchor rule + yaw/tilt/boom +
optional drift, so a spell (or a whole family) can just say `shots:
['glam', 'sideDolly']`:

| Shot | Framing | Use |
|---|---|---|
| **Glam cam** | Low ¾ hero shot: TPS anchor on subject, tilt ~70 (looking up), yaw 30–45° off facing, boom ~2.5 tiles, slow 5°/s orbit drift | Self-buffs, power-ups, kill confirms — XCOM's promotion screen energy |
| **Reverse OTS** | Over the VICTIM's shoulder looking back at the attacker | Dread beats, incoming charges, Boo |
| **Side dolly** | Perpendicular to the action axis, camera TRAVELS parallel to it | Beams, dashes, thrown units — the whole "see it in its glory" fix |
| **Bullet cam** | Camera rides ~0.5 tiles behind a projectile down its path | Railgun, Take Aim, Hail Mary |
| **Witness cam** | Frame the action from over the shoulder of a NEARBY third unit (ally or enemy bystander) | Big AOEs and kills — XCOM's squadmate reaction shot; makes the world feel inhabited |
| **Crane** | Vertical boom raise/drop while holding the subject in frame | Sky throws, flight, weather, tall props |
| **God shot** | Straight-down top view | Zones, terrain edits, crop circles, gather-then-strike patterns |
| **Push-in** | Slow boom shorten toward a face/prop, no cut | Tension holds, insert shots |

Witness cam has one rule: the witness must pass the fog gate too, and its own
model renders in the foreground edge of frame, slightly defocused-by-framing
(big and low, not blurred — no `filter`).

## New primitives worth building (each unlocks many entries)

- `[NEW: void stage]` — see its own section below. The single biggest
  personality lever in this doc.
- `[NEW: slow-mo]` — a global time-scale ramp (wrap `actionMs` with a tween-able
  multiplier). Unlocks High Noon, Take Aim, Hail Mary, No Mercy, Railgun…
- `[NEW: dolly-zoom]` — tween `ThreeCamera.setFOV()` against boom length for the
  Vertigo effect. Unlocks Ego Death, Sleep Paralysis, Black Hole, Time Rewind.
- `[NEW: face cam]` — TPS anchor at HEAD height with a ~2-tile boom and slow yaw
  drift; the Boo shot. Reusable for every "look them in the eye" beat.
- `[NEW: grade]` — full-screen DOM color-grade overlay (sepia / desaturate /
  invert / vignette) above the Three canvas. Cheap, huge personality.
- `[NEW: freeze-frame]` — pause renderer updates for N ms while UI keeps running
  (To Be Continued, High Noon clock-strike, Absolute Zero).
- `[NEW: caster fade]` — dissolve/reform a unit's model via material opacity +
  particle handoff (Boo, Mist Form, Instant Transmission, Shed Skin).
- `[NEW: side dolly]` — the beam-axis camera track (see The Beam Reel). One
  function: given a line of tiles, run the camera parallel to it at a chosen
  lead/lag. Reused by dashes, thrown units, and every line spell.

---

## VOID STAGE — the isolation shot

The Blue Screen pitch, generalized: for one dramatic beat, **the entire world
disappears** — map, terrain, sky, objects, every other unit, tile chrome, HUD
clutter — leaving ONLY the caster and target(s) standing in a void of pure
color. Persona all-out-attacks and Pokémon Z-moves live on this trick: total
art-direction control for ~1.5 seconds, at almost zero asset cost.

**Implementation sketch (Three renderer):**
- `VoidStage.enter({ actors: [unitIds], palette: 'bsod', ms: 1600 })`
- Swap `scene.background` to the palette's gradient sky (CanvasTexture); set
  `visible = false` on the board root group EXCEPT the actor models; spawn a
  soft radial shadow disc + a palette-tinted glow pool under each actor so
  they don't float, and a tinted fill light so they pick the palette up on
  their models; kill weather/ambient particles.
- DOM side: a `body.void-stage` class hides tiles, nametags, and HUD chrome
  except the actors' own overlays (reuse the dirty-flag render, no rebuild);
  a per-palette vignette keeps the frame edges from reading flat.
- **Transitions are SMOOTH cross-fades, both ways (2026-08-10):** a
  palette-tinted veil blooms over the frame (~280ms), the world swap happens
  fully covered, and the veil parts on the other side (~460ms). Same
  choreography on exit. A one-frame hard cut reads as a rendering bug, not
  drama — the fade is mandatory.
- Palettes are data, not code: background + optional floor glow + optional
  ambient particle set + optional animated layer (static, code-rain, stars).
- **Online:** relay `{type:'voidStage', palette, actors, ms}` — the guest
  replays it locally. **Fog:** void stage is the SAFEST shot in the game —
  the world is hidden, so nothing can leak; the actors themselves must already
  pass the fog gate or the beat is skipped entirely.
- **Budget rules:** 1.2–2.2s max; signature casts only (never basic attacks);
  if two void-stage spells fire in the same round, the second one plays its
  non-void fallback — scarcity keeps it special.
- **Flash safety:** palettes never strobe faster than 3Hz; `static` and
  `kaleido` respect a reduced-motion setting.

**Palette table** (assignments; ✦ = entry specced in this doc):

| Palette | Look | Assigned spells |
|---|---|---|
| `bsod` | Flat #0827F5, white monospace glyphs falling like snow | ✦28 Blue Screen |
| `abyss` | Pure black, actors lit by a single cold top-light | ✦60 Shadow Crush, ✦43 No Mercy (execute case), Sneak Slash while invisible |
| `bone` | Blown-out white, soft grey floor contact | ✦2 Absolute Zero (the pre-shatter hold), ✦67 Exorcism, ✦3 Ego Death (final beat) |
| `bloodlust` | Deep red gradient, slow drifting black particles | Blood Frenzy, ✦68 Devour Soul, ✦15 Baphomet's Rite (post-pentagram beat) |
| `sepia` | Aged paper tone, film grain, vignette | ✦21 To Be Continued, ✦1 High Noon (the hover-hold) |
| `starfield` | Near-black + parallax starlayers | ✦61 Nebula, ✦45 Star Crossed, ✦7 Merkaba (spin-up beat) |
| `static` | Analog TV noise (animated), occasional tear line | ✦4 Time Rewind, Crash Loop, Memory Leak |
| `code` | Black + falling green glyph rain | ✦65 Neural Hack, ✦50 Singularity (crush frame), Predictive Model |
| `dream` | Purple-indigo gradient, slow floating motes, soft focus framing | ✦64 Eternal Slumber, ✦31 Sleep Paralysis (POV interior), Lucid Trap |
| `inferno` | Black floor, ember gradient sky, rising sparks | ✦62 Contract, Hellfire Crown, Infernal Conscription |
| `valentine` | Blush pink gradient, drifting hearts | ✦59 Charm, ✦27 Meow (the charger beat), Love Bite |
| `ocean` | Deep teal water-light caustics from above | ✦29 Walk the Plank (the drop), Deep Dive, Call of the Deep |
| `kaleido` | Slow-rotating mirrored color wheel | ✦63 Bad Trip, Ayahuasca Retreat, Space Disco |
| `hearth` | Warm fireplace glow from frame-left, falling snow frame-right | ✦70 Lump of Coal, Blizzard Present |
| `stadium` | Night-navy + four floodlight glows from the corners | ✦30 Hail Mary, End Zone Dance |
| `hex` | Violet-black, a slowly rotating cursed sigil as the floor | ✦69 Hex of Agony, Family Curse |

One system, sixteen looks, forty-plus spells upgraded. Add palettes freely —
they're a background + two particle layers each.

---

**Global rules for every entry below** (do not re-litigate per-spell):
1. All of it gates on `state.cinematicMode`, suppresses under `state.devAutoSim`,
   and times through `actionMs()`.
2. RULE #2 — every beat must be relayed to the online guest (`_emit('relay')`
   + guest dispatcher) and every camera move must pass the fog gate. A
   cinematic that leaks a hidden unit's position is a bug, not a feature.
3. New model animations come from the shared libraries: consolidate new clips
   into a MAL-style animation-only GLB (see PLAYTEST_NOTES "MAL library") and
   wire them as new `UAL_SLOTS` entries — never per-character exports.
4. Camera always releases through the existing restore path (`_preCineView`),
   never a hand-rolled reset.

---

## The spec: Boo (`raceBoo`, Ghost)

*"Materialize with a shriek. MEDIUM magic damage, applies Stagger."*

The caster dissipates and reappears behind the target; the cinematic cam stays
glued to the victim's face the whole time, so the player experiences the jump
scare from the victim's side.

| Beat | Time | Camera | Animation / VFX |
|---|---|---|---|
| 0 — Dissipate | 0–400ms | None yet — board view holds | Caster model dissolves bottom-up `[NEW: caster fade]`; cold-mist particles pool on the origin tile and stay there (a "cold spot" the camera can find later). Faint `teleport` SFX, reversed. |
| 1 — Face cam | 400ms | **Hard cut** to `[NEW: face cam]` on the TARGET: TPS anchor at head height, boom ~2.2 tiles, tilt ~80° (near-level), framed slightly off-center so the target's far shoulder leaves negative space | Target plays `idle` — the calm before. Ambient audio ducks ~50%; a low sub-bass drone fades in. |
| 2 — The pan | 400–1900ms | Slow yaw drift, ~10° over 1.5s (`_cineBeatMove`), panning across the face toward the empty shoulder | Nothing happens. This is the horror beat — hold it. Mist wisps drift through the frame edges. |
| 3 — Materialize | 1900ms | Camera keeps drifting — do NOT reframe on the caster; it must feel like the *camera* hasn't noticed | Caster fades in OVER THE FAR SHOULDER, background of frame, eyes first (two glowing points), then the body at ~60% opacity. Engine: teleport caster to the tile behind the target (opposite its facing; any free adjacent tile as fallback). |
| 4 — BOO | 2200ms | 2-frame push-in toward both faces (hard cut, then 120ms settle) + screen shake | Shriek SFX at full volume (this is the one moment audio spikes). Caster snaps to 100% opacity playing `castAOE` (arms-out lunge); target plays `hitHeavy` (Face_Punch_Reaction). Damage number + Stagger pop. Ecto-green shockwave ring, world-mode, from the caster. |
| 5 — Release | 2600ms | Normal restore via `_preCineView` | Mist at the origin tile dissipates. Ambient audio returns. |

Total ~2.6s — long for a MEDIUM-damage spell, which is fine: this is a
signature. If the target dies to it, extend beat 4 with the kill flare.
Online: relay beats as one `relay` event with timestamps; the guest replays the
whole sequence locally. Fog: if the viewer can't see the target, skip beats
1–4 entirely (standard hidden-actor gate).

---

# The 70 named candidates

Ordering within each category ≈ bang-for-buck (payoff × how often players see it).

## A. Signature ultimates — full screen-stopper cinematics (15)

**1. High Noon** (`raceHighNoon`, Cowboy) — *guaranteed crit*
Charger shot with the letterbox, but replace the spell-name banner with a
clock face striking twelve. `[NEW: slow-mo]` ramps time to ~0.2× as the side
profile frames both duelists; the hover-hold plays on the `sepia` void stage
(world drops away — just two silhouettes and heat shimmer). The cowboy's hand
hovers — two full seconds — then the MAL `Cowboy_Quick_Draw_Shooting` clip
fires at FULL speed as the real world SLAMS back in with the gunshot. One
tracer, kill flare. The delay IS the spell.

**2. Absolute Zero** (`raceAbsoluteZero`, Ice Queen) — *"stop every molecule"*
The desc already wrote the storyboard: hard cut to the target, `bone` void
stage bleaches the world away over 800ms while every ambient particle freezes
mid-air `[NEW: freeze-frame]`. A crystal lattice grows over the victim model
(scale-up ice shell prop). One beat of total silence, alone in the white —
then the shatter: lattice explodes, the world rushes back with the sound.

**3. Ego Death** (`sharedEgoDeath`, Machine Elves) — *dissolve the self*
`[NEW: dolly-zoom]` on the victim (boom out, FOV in) so the world stretches
away behind them, while a hue-rotate `[NEW: grade]` spins the color wheel —
then the world doesn't just stretch, it LEAVES: cut to `bone` void, the victim
alone in white, scaling down 100%→0% into a point that detonates as a flash.
The one spell where the camera should feel *wrong* on purpose.

**4. Time Rewind** (`raceTimeRewind`, Glitch) — *replay their last blow backward*
Camera whip-pans to the target, then the `static` void stage swallows the
world — actors alone against analog TV noise with a REW ◀◀ glyph in the
corner while the victim's `hit` clip literally plays in reverse at 2×
(three-renderer already retargets clips — negative timeScale). Damage numbers
count UP from the floor. Peak glitch-race identity.

**5. Black Hole** (`sharedBlackHole`, Cosmic Wraith) — *5×5 pull + crush*
Descent-cam in reverse: camera starts wide overhead (God shot) and is itself
slowly DRAGGED toward the singularity center (focal tween + `[NEW: dolly-zoom]`),
as if the lens has mass. Units, loose particles, and debris spiral in along
the pull paths the engine already computes. Screen edges vignette-darken.
Release with a hard cut back to tactical — the snap-back is the "you escaped"
beat.

**6. Supernova** (`raceSupernova`, Orb of Light) — *caster self-detonates AOE*
The caster IS the bomb, so invert the OTS grammar: camera anchors on the
orb and booms OUT continuously through the whole cast (the opposite of every
other spell), letting the swell fill the frame. Three pulses of the orb model
scaling up (1.1×, 1.3×, 1.6×) with rising pitch, then whiteout `[NEW: grade]` →
the blast ring. Enemies' `hitHeavy` all fire on the same frame.

**7. Merkaba** (`raceMerkaba`, Seraphim) — *sacred chariot detonation*
The spin-up happens in the `starfield` void: the seraphim alone among stars as
two counter-rotating wireframe tetrahedra assemble around them (geometry-as-
VFX, no textures), camera craning up past them into the spin. Three rings of
light collapse inward — hard cut back to the REAL battlefield exactly at
detonation, shockwave already expanding. The void makes the return land like
an orbital strike arriving from somewhere else.

**8. Nuke** (`sharedNuke`, Politician et al.) — *delayed 1-turn AOE*
The mark turn already has the siren; spend the budget on the PAYOFF turn:
descent cam follows the warhead down (exists), then at impact `[NEW: grade]`
full-white for 300ms → silhouette pass: every unit renders as a black cutout
against white for two beats (material swap) → mushroom cloud column with the
God shot slowly tilting up at it. The silhouette flash is the signature frame.

**9. Meteor** (`meteor`, Cosmic Mage) — *3×3, knocks flyers down, breaks buildings*
Already has a descent cam — upgrade it into the "duck!" shot: camera sits LOW
behind the impact zone facing the sky (TPS anchor, tilt past horizon), meteor
grows from a dot to full frame, hard cut to God shot on impact + crater
reshape + dust ring. One camera flip makes it feel twice as big.

**10. Knights of Round** (`raceKnightsOfRound`, King Arthur) — *pull every ally to the king*
The FF7 homage the id begs for: letterbox charger, then the camera does one
slow 360° yaw orbit around Arthur (`_cineBeatMove` chaining yaw +90° × 4) as
each ally materializes mid-orbit, kneeling (`castTrap`'s Fixing_Kneeling reads
as kneeling). Final frame: full party in a ring, banner SFX. Zero damage,
pure hype — exactly what a rally spell wants.

**11. Awakening** (`raceAwakening`, Chosen One) — *cleanse + 30% heal + ATK/SPD surge*
Anime power-up on the **glam cam**: low hero angle, slow orbit drift,
`[NEW: grade]` vignettes everything but the caster dark, wind-blast particles
stream OUTWARD along the ground plane (held `castAOE` charged pose). Eyes
flash. Every debuff icon shatters off them one by one.

**12. Atomic Breath** (`raceAtomicBreath`, Kaiju) — *line of blue atomic fire*
The Beam Reel grammar (section G), maximum size: **side dolly** perpendicular
to the line, charge-up pulses of blue glow rising through the kaiju model
bottom-to-top with the iconic rising whine, then the beam crosses the FRAME
side-on for its full travel, camera tracking the beam head. Guests get the
full track — relay the hit-tile list.

**13. Ki Wave** (`raceKiWave`, Ki Fighter) — *line beam*
The Kamehameha: OTS beat 1 holds LONGER than normal (1.2s) on a new
`castCharge` clip (hands cupped at hip — one MAL clip to source) with a
growing sphere between the hands, camera slowly pushing in; then the firing
cut is the Beam Reel's **¾ diagonal**: camera high behind the caster's
off-shoulder so the beam crosses frame corner-to-corner, whiting out the far
end. Recoil: caster slides back half a tile.

**14. Team Strike** (`sentaiTeamStrike`, Super Sentai) — *5 hits*
Each of the 5 hits gets a color-flash cut: hard cut to a fresh angle per hit
(alternate left OTS / right OTS / side / low / God shot — 5 framings, ~350ms
each), each with a colored `[NEW: grade]` tint (red/blue/black/green/yellow)
and a painted speed-line background behind the victim. After hit 5, the
caster strikes a pose (held `castKick` final frame) while a small explosion
goes off BEHIND them. They do not look at it.

**15. Baphomet's Rite** (`raceBaphometsRite`, Goatman) — *HP-cost AOE*
The self-harm beat first: face cam on the CASTER drawing blood from the palm
(`castConsume` re-flavored), HP tick visibly drains, a world-mode pentagram
inscribes itself under the AOE tiles line-by-line. Then the `bloodlust` void
swallows everything for one beat — the goatman alone in red, head bowed —
and the blast column fires as the world returns. The price-paid pause is what
sells the pact.

## B. Verticality — sky throws, drops, floods (5)

**16. Abduction Beam** (`raceAbductionBeam`, Grey) — *tractor-lift and drop*
Beat 1: God shot directly above the victim as a cone of green light pins them;
they rise INTO the camera, flailing with `fall`'s pinned-hips flail. Beat 2:
hard cut to ground-level **crane** looking up — the victim is a silhouette in
the beam — then the beam snaps off and the existing drop/fall-damage path
takes over. Comedy or horror depending entirely on hold length; hold it long.

**17. Dragon Toss** (`raceDragonToss`, Dragon) — *grab, soar, hurl*
The showcase for the vertical **side dolly**: camera locks a side profile and
CRANES UP with the pair as the dragon climbs 4 levels, then whip-pans to
follow the thrown victim's arc to the landing tile (projectile-style tracking
of a UNIT). Collision hit uses `hitHeavy` on both.

**18. Descending Wrath** (`raceDescendingWrath`, Fallen Angel) — *fly-only slam*
Reverse descent cam on a UNIT: camera starts framing the target area from
ground level, angel drops THROUGH the top of frame trailing black feathers,
impact = crater reshape + fire ring + a slow rise back to tactical. The
feather trail lingering in the air for 2s is the signature. ~20 billboard
particles, slow gravity.

**19. Avalanche Strike** (`raceAvalancheStrike`, Yeti) — *damage scales with drop height*
The camera should SELL the height the damage math rewards: beat 1 frames the
yeti at cliff edge from below (tilt up), beat 2 tracks the leap apex with a
brief `[NEW: slow-mo]` hang (200ms at 0.3×), beat 3 hard-cuts to the victim's
**reverse OTS** as the shadow grows on their tile. Snow-dust shockwave +
fall-damage-styled number.

**20. Great Flood** (`raceFlood`, Atlantean) — *fills the terrain basin*
The one spell where the TERRAIN is the star: God shot wide over the basin,
then water level visibly rises tile-by-tile (animate the engine's fill set in
fill order, ~80ms stagger) while the camera slowly drops TOWARD the waterline
until spray hits the lens (droplet overlay `[NEW: grade]`). Units caught play
`fall` flail as they bob. End on the drowned diorama.

## C. Comedy / meme beats — cheap, huge personality (10)

**21. To Be Continued** (`raceToBeContinued`, Swordfighter) — *delayed end-of-round hit*
When the delayed hit LANDS: `[NEW: freeze-frame]` on the victim mid-`hitHeavy`,
`sepia` grade, and a black arrow banner slides in bottom-left reading
**"To Be Continued ➤"** with a music sting. Resume after 900ms. The whole joke
is one overlay + one freeze. Ship this first; it's the doc's best
effort-to-delight ratio.

**22. Eject!** (`raceEject`, Mech) — *panic escape teleport*
Klaxon + red cabin light flashes on the mech model (emissive pulse), canopy
prop pops OFF with physics, pilot-seat prop rockets up on a smoke column while
the camera **cranes** up to track it, parachute opens, drifts to the
destination tile, mech re-materializes around it. EJECT EJECT EJECT stenciled
on screen in military type. ~1.8s of pure cartoon.

**23. Probe** (`raceProbe`, Grey) — *MEDIUM damage, deadpan*
The camera does the joke by REFUSING to show it: OTS beat 1 on the grey (slow
latex-glove snap — `castSupport` re-timed), then the camera PANS UP AND AWAY
to the sky/moon, a white flash off-screen, one damage number floats up from
below frame. The victim's next idle loop plays 20% faster. Never show
anything. Deadpan is the entire bit.

**24. Executive Order** (`raceExecutiveOrder`, Politician) — *stun*
~~Document insert shot~~ **CUT (2026-08-10 playtest):** the paper filling the
frame duplicated the spell-name chrome (every cast already names itself top-
left) and read as clutter, not comedy. Now takes the standard debuff family
victim-cam. If this ever gets a second pass, it needs real prop acting (desk,
signing animation), not a text card.

**25. Naughty List** (`raceNaughtyList`, Santa) — *ATK down*
~~Hex-void scroll insert~~ **CUT (2026-08-10 playtest):** a violet void stage
on a plain ATK-down was unearned and read as "the screen just went purple" —
the palette had no connection to the Santa fantasy. Now takes the standard
debuff family victim-cam. A future version should be built from Santa props
(the scroll, the double checkmark, coal dust), not from the void system.

**26. Ram Charge** (`raceRamCharge`, Honda Civic) — *dash + stagger*
The chase cam exists; make it Tokyo Drift: **side dolly** LOW at hubcap
height, motion-blur speed lines `[NEW: grade]` at the frame edges, two nitro
flames from the exhaust, a handbrake DRIFT on the final tile (car model yaws
40° past its heading and counter-steers) before impact. License-plate insert
shot on the hold: "ENTROPY".

**27. Meow** (`raceMeow`, Catgirl) — *AOE DEF down, zero damage*
Face cam on the catgirl: slow push-in, sparkle particles, pupils dilate — and
the charger beat fires on the `valentine` void, full letterbox, as if it were
a doomsday ultimate. One devastating "meow." Hard cut back to the real world:
every enemy staggers with heart-crack particles and their armor icons visibly
droop. Treating it EXACTLY like an ultimate is the joke.

**28. Blue Screen** (`raceBlueScreen`, Glitch) — *stun* — **THE void stage flagship**
Mid-cast, the ENTIRE WORLD CRASHES: map, sky, terrain, objects, every other
unit — gone in one frame, replaced by the flat `bsod` blue. Only the glitch
and the victim remain, standing on nothing. White monospace text scrolls
beside them: `:( UNIT_HAS_STOPPED_RESPONDING — collecting error info… 30%`
(never passes 30). The victim hard-freezes mid-animation (pause its mixer)
and tips over rigidly like a mannequin — no joint movement. Modem-crash SFX.
Hard cut: the world "reboots" back in one frame, victim still planked on
their tile with the Stun icon. The glitch straightens its posture like
nothing happened. ~1.8s. This entry is the reference implementation for the
whole Void Stage system.

**29. Walk the Plank** (`raceWalkThePlank`, Pirate) — *execute below HP threshold*
On the EXECUTE case only: a plank prop extends from the victim's tile, side-
profile cam level with it, the victim auto-walks it (`walk` clip, 3 steps),
pauses at the end — looks at camera — drops. The splash swallows the world
into the `ocean` void for one beat: caustic light, the victim sinking past
frame, hat drifting up. Cut back; the hat floats on the new water tile.
Non-execute keeps the normal surge; save the ceremony for kills.

**30. Hail Mary** (`raceHailMary`, Quarterback) — *HEAVY single-target*
`[NEW: slow-mo]` **bullet cam** on the football — track it in slow spiral
rotation from a low trailing angle for the full arc while the `stadium` void
palette's floodlights glow at the frame corners and crowd noise swells.
Impact = tackle: victim's `hitHeavy` plus a yellow penalty-flag particle
landing on the tile. Announcer-style "OHHH!" sting optional but correct.

## D. Horror / creep — the fog-of-war game's dark half (8)

**31. Sleep Paralysis** (`raceSleepParalysis`, Succubus) — *Rooted*
The POV shot the game doesn't have yet: camera snaps to the VICTIM's eye
position looking up (tilt past horizon), edges vignetted like half-closed
eyes — and the sky is the `dream` void's purple, not the real sky, because
they're not in the real world anymore. The succubus slides INTO frame from
above, inverted, face filling the lens. 900ms hold, heartbeat slowing. Cut
back to tactical: victim has the Rooted icon and a cold-sweat drip particle.

**32. Possession** (`racePossession`, Ghost) — *Jammed*
Pairs with Boo: the ghost model dissolves INTO the victim (fade + converge
particles), the victim's nametag flickers between its name and the ghost's,
their idle switches to a marionette sway (Block3 held mid-frame, slow drift)
and their eyes glow the ghost's color while Jammed lasts. Camera: single hard
cut to face cam for the entry, nothing more — the persistent wrongness IS the
effect.

**33. Red Eyes** (`raceRedEyes`, Mothman) — *Marked*
Fog-of-war native: the victim's camera beat shows two red points igniting in
the DARK (nearest fogged tile; behind the mothman as fallback), then a
blink-and-gone flutter SFX. The Marked icon becomes a tiny red-eyes glyph.
If the mothman is hidden from the viewer, the eyes STILL show — they're the
spell, not the unit, and reveal nothing about the true tile.

**34. Crow Storm** (`raceCrowStorm`, Scarecrow) — *HEAVY AOE + Discord*
The sky darkens (`[NEW: grade]` cool dim) as a murder of crows (~40 billboard
flock on curved paths — the bat-swarm system does this shape) spirals over
the AOE, then FUNNELS DOWN like water into a drain, one column per enemy.
Camera: God shot for the gather, hard cut to a **witness cam** over a nearby
unit's shoulder for the funnel hit. The scarecrow never moves. That's the
creepy part.

**35. Outbreak** (`raceOutbreak`, Zombie) — *5×5 infection zone, reapplies*
"Patient zero hits the ground": the zombie collapses face-first (`death`
clip) at the zone center, green miasma pours OUT of the body tile-by-tile,
and it STANDS BACK UP wrong (`death` reversed, slightly too fast). Each
round's re-poison tick reuses a mini version. Camera: one beat move down into
the miasma, low, so the fog rolls past the lens.

**36. Raise the Dead** (`raceRaiseDead`, Necromancer) — *reanimate remains*
The camera starts ON the gravestone (hard cut, low), necromancer off-frame —
only their shadow and chanting audio. Green soul-wisps converge, the ground
bulges, and the abomination claws OUT toward the lens, forcing the camera to
retreat 2 tiles (beat move backward — the only shot in the game where the
camera flinches).

**37. Weigh the Heart** (`raceWeighTheHeart`, Anubis) — *more damage at low HP*
A golden scale prop materializes beside the victim: their glowing heart on
one pan, a feather on the other. The scale TIPS proportionally to their
missing HP — the player literally reads the damage bonus off the prop — then
slams down and the damage lands with a gong. Camera: side profile, scale
center-frame. At full HP the feather wins and the spell visibly
underwhelms: mechanics as theology.

**38. Summon Blood Rain** (`sharedSummonBloodRain`, Vampire) — *weather*
Weather summons cut to the sky — this one earns it: **crane** fully past the
horizon, clouds tint dark red `[NEW: grade]`, and the first three drops hit
the LENS and streak. Back to tactical: the rain system re-colored crimson,
every nametag briefly streaks red. One-time flourish per cast, then the
weather system owns it.

## E. Character acting — animation-led beats (7)

**39. Reassemble** (`raceReassemble`, Skeleton) — *30% self-heal*
The skeleton collapses into a bone PILE (death clip → bone-pile prop swap),
holds one comic beat, then every bone flies back into place (reverse-play the
death clip while bone-sprite particles converge), skull screwed on last with
a hand. Camera: locked side profile, no cuts — deadpan single take.

**40. Howl** (`raceHowl`, Werewolf) — *self ATK buff*
Camera orbits 90° to put the werewolf in silhouette against the sky (current
yaw +90°), tilt up — **glam cam** at its moodiest. One new `howl` clip (head
thrown back — MAL source). A moon glow brightens behind them, and the howl
SFX gets a distant SECOND howl answering a beat later. Every werewolf player
will cast it every match just to hear the answer.

**41. Instant Transmission** (`raceInstantTransmission`, Ki Fighter) — *5-tile teleport*
Two fingers to the forehead (re-timed `castSupport` first frames), 400ms hold
with a push-in — then the model VANISHES with a single afterimage stretched
along the travel line and the camera HARD CUTS to the arrival tile where
they're already in idle. No travel shot at all: the cut IS the teleport. Do
not ease anything.

**42. Indomitable Will** (`raceIndomitableWill`, Homosapien) — *survive lethal at 1 HP*
Entirely reactive — fires when the SAVE triggers, not on cast: the killing
blow lands, `[NEW: freeze-frame]` at the frame the HP bar hits 1, grade to
high-contrast, camera pushes to face cam: the human on one knee (`hitHeavy`
held at its lowest frame), fist planted in the ground. One breath SFX. Then
they rise, un-freeze, play continues. The race's whole identity in 800ms.

**43. No Mercy** (`raceNoMercy`, Antihero) — *SEVERE, scales with missing HP*
Execution grammar: below 30% HP, the world abandons the victim — `abyss` void,
one cold top-light, the antihero walking the last tile SLOWLY (walk clip at
0.6×) while the victim crawls back. The kill is flash-to-black: 2 white
frames, then black 200ms, sound carries the hit, cut back to the real world
with the body. Above 30% HP: completely normal shot. The spell teaches its
own threshold through the camera.

**44. Wish Granted** (`raceWishGranted`, Djinn) — *ally ATK+DEF buff*
The djinn snaps its fingers → smoke ERUPTS from below the ALLY, camera
hard-cuts to the ally emerging from the smoke striking a pose (held `castAOE`
charged frame) on the **glam cam**, golden sparkle rain, cursive "wish
granted ✦" floating text. The ally — not the caster — gets the hero shot;
that's what a wish feels like.

**45. Star Crossed** (`raceStarCrossed`, Fortune Teller) — *affliction by zodiac*
The victim's actual zodiac constellation (the game HAS zodiac state) draws
itself star-by-star above them — and for the flare, the `starfield` void
takes the frame: victim alone among their own stars as the constellation
lines CROSS OUT with two harsh strokes. Camera: crane up to the
constellation, snap down on the cross-out. Twelve tiny variants for free
personality; the data is 12 small point lists.

## F. Mechanics-made-visible — the camera teaches the rule (5)

**46. Trick Room** (`raceTrickRoom`, Fairy) — *turn order reverses, 3 rounds*
The whole BOARD gets the beat: widest God shot, then the world flips upside
down and rights itself over 900ms — a fast 180° yaw sweep with a
`[NEW: grade]` invert flash at the midpoint — and every unit's turn-clock
portrait visibly shuffles into reverse order (HUD animates the reorder —
relay it). Glittering clock-face decal under everything for the duration.
Players never misread turn order again.

**47. Take Aim** (`headshot`, Sniper class) — *hit lands at END of round*
Cast: a red laser dot appears on the victim (decal that follows them as they
move — genuine dread). Payoff at end-of-round: `[NEW: slow-mo]` **bullet
cam** — pick up the tracer mid-flight for the last 40% of travel at 0.3×,
then full speed through the impact. If the mark broke vision, the beat is a
scope-view overlay sweeping and finding nothing. Both outcomes get shown;
the rule becomes legible.

**48. Railgun** (`railgun`, Gunner class) — *piercing line, ignores DEF*
**Bullet cam**: hard cut to ~0.5 tiles BEHIND the slug, traveling the full
line at high speed (~90ms per tile), each victim snapping into `hitHeavy` AS
the camera passes through them, air distortion rings at each. End on the
slug burying into terrain with a dust geyser. The pierce mechanic is
unmissable because the camera pierced too.

**49. Polymorph** (`racePolymorph`, Wizard) — *ATK/M.ATK down, "Ribbit."*
Puff of smoke swallows the victim → their model is REPLACED by a tiny frog
(one shared frog model, any race) for the debuff duration; nametag stays,
portrait gets a frog overlay, walk becomes a hop (scale-bounce). Attacks
still work — which is funnier. Camera: OTS beat 2 lingers an extra 600ms on
the frog. Ribbit SFX on every action while transformed.

**50. Singularity** (`raceSingularity`, AI) — *AOE pull + crush*
Terminal-green wireframe `[NEW: grade]` flickers over the AOE as a lattice of
gridlines WARPS toward the center — spacetime as a graph being optimized.
Enemies drag along the warping lines; floating text prints descending
"loss: 2.31 → 0.04" instead of charge glyphs. The final crush frame cuts to
the `code` void for 300ms — actors alone in the glyph rain as the grid
converges to a point — then reality resumes, dented.

## G. THE BEAM REEL — line spells get their own grammar (6 + the family)

**The problem:** every `line` / `linePush` / `splitBeam` spell fires
caster→target, and the action cam frames along that same axis — so the beam
foreshortens into a muzzle flash and a far-away impact. Twenty of the game's
most visually expensive spells are invisible at the moment they fire.

**The rule: never film a beam down its own axis.** 30–90° off-axis, always.
Three named framings (build once in `[NEW: side dolly]`, reuse for all 20):

- **Side dolly (90°)** — camera perpendicular to the line at its midpoint,
  yaw = beam heading ±90° (auto-pick the side with more open board), tilt
  ~78–82. Short lines (≤4 tiles): frame the WHOLE line and hold. Long lines:
  boom to ~4 tiles tall and TRAVEL with the beam head at beam speed, victims
  silhouetted as it passes through frame. This is the default firing cut.
- **¾ diagonal (40–50°)** — camera high behind the caster's OFF shoulder so
  the beam crosses frame corner-to-corner into depth. Use when walls/terrain
  would clip the perpendicular position (the TPS boom already collides).
- **End-cap reverse** — for piercing beams only: final 300ms cuts BEHIND the
  last victim, looking back up the line INTO the oncoming beam — the
  staring-into-the-headlight shot. Bloom fills frame at impact.

Family default = OTS cast beat → hard cut to side dolly for the travel →
(pierce only) end-cap reverse → restore. Named beam picks:

**51. Dragonfire** (`raceDragonfire`, Dragon) — *line + Burn*
Breath cones read best fully side-on: side dolly with the dragon rearing
(head-back charge pose, one MAL clip), then the flame column sweeps through
frame left-to-right, each victim igniting AS the fire front crosses them
(stagger the burn procs to the camera's travel, not the engine tick — sync
via `onImpact`). Heat-ripple grade at the frame edges. Lava-glow light bounce
on the dragon's underside while breathing.

**52. Laser Beam** (`raceLaserBeam`, Superhero) — *line + Burn*
The Superman shot: **face cam push-in** as the eyes ignite (emissive flare),
then hard cut to the ¾ diagonal — twin beams converging to one line crossing
the frame into depth, slicing a glowing molten scar decal along the ground
the whole length. End-cap reverse for the last victim: two red points growing
in the dark.

**53. Fractal Needle** (`raceFractalNeedle`, Mantid) — *splitBeam, seeks enemies*
The one beam that BRANCHES — so show the graph: side dolly on the main beam,
then at each split point the camera RE-PICKS the branch with the most victims
ahead (hard cut, new side dolly axis per branch, ~200ms each). Crystalline
refraction flash at every fork. The final frame is a God shot of the whole
completed branch tree glowing for 400ms — the spell draws its own diagram.

**54. Sonic Boomerang** (`raceSonicBoomerang`, Siren) — *line, hits going AND returning*
Side dolly follows the crescent OUT — then the camera gets caught looking:
the crescent exits frame, one beat of stillness on the empty line… and the
WHIP-PAN back as it returns the other way, hitting everyone again, ending on
the siren's catch (one-hand snatch, head turned away — micro-clip or held
`castThrow` final frame). The camera being "surprised" by the return teaches
the double-hit mechanic better than any tooltip.

**55. Suppressive Fire** (`raceSuppressiveFire`, Marksman) — *line + Slow*
Not one beam — a STREAM: side dolly holds still while dozens of tracer
sprites rip through frame with muzzle-strobe light on the marksman
(emissive flicker), shell casings fountaining (small physics sprites, they
can just fall through the floor). Victims flinch-walk backward under the
Slow proc (`hit` clip looped at low weight). War-movie audio: the SFX is
80% of this one.

**56. Hellmouth** (`raceHellmouth`, Demon) — *line, leaves lava*
Promoted from honorable mentions because the beam grammar completes it: the
ground UNZIPS tooth-by-tooth along the line (per-tile jaw props tearing
open, ~90ms stagger) while the side dolly tracks the opening seam like a
fuse burning. Lava light floods up onto every victim as their tile splits.
End-cap: the last tile's jaws SLAM shut, and the camera holds on the smoke
from between the teeth.

## H. VOID STAGE GALLERY — isolation-shot picks beyond Blue Screen (12)

The system is specced above; these are the casts that wear it best. Each is
~1.5s: world vanishes → the beat plays against the palette → hard cut back.

**57. Charm** (`raceCharm`, Succubus) — `valentine`
The world blushes away; succubus and victim alone in pink. She circles them
once (camera counter-orbits so both stay in frame — a waltz), trails of
hearts; the victim's `hit` reaction re-timed SLOW so it reads as a swoon.
Back in the real world, the Charm icon lands with a lipstick-kiss decal.

**58. Shadow Crush** (`raceShadowBind`, Shadow Entity) — `abyss`
Blackout. Only the victim is lit (single cold top-light); the CASTER is
present but visible only as eyes and a silhouette-edge. Shadow hands rise
from the floor and constrict — the victim's model gets a squeeze via a brief
scale pinch on the torso bone (retarget-safe: animate the hips/spine scale).
The Slow icon appears BEFORE the world returns — cursed in the dark.

**59. Nebula** (`sharedNebula`, Superhero) — `starfield`
The battlefield becomes deep space: enemies alone among the stars as a
newborn sun ignites above them, swells through three pulses, and collapses —
the supernova IS the transition back, the whiteout resolving into the real
battlefield already scorched. The 5×5 AOE ring is the crater of a star.

**60. Contract** (`raceContract`, Demon) — `inferno`
Ember void: demon and victim across a floating desk of black stone, a scroll
unrolling between them. A quill signs ITSELF in red; insert push-in on the
signature line — the victim's actual unit name scrawls in. SLAM — the scroll
vanishes, world returns, Contract icon lands. (Same desk-insert grammar as
Executive Order — the joke is that the demon's paperwork is identical to the
politician's.)

**61. Bad Trip** (`raceBadTrip`, Shaman) — `kaleido`
The mirrored color wheel spins slowly behind the victim; THREE copies of the
shaman orbit them at 120° offsets (two cheap model clones, no extra
animation — same mixer state), all casting in sync. Which one is real is
never answered. Slow proc lands as the world reassembles slightly
wrong-colored for 800ms (`[NEW: grade]` hue offset decaying to zero).

**62. Eternal Slumber** (`raceEternalSlumber`, Dreameater) — `dream`
The AOE victims sink INTO the void: world fades, purple gradient, every
victim drifting downward off their feet (slow translateY + `fall` flail at
0.3× — underwater physics). The dreameater walks BETWEEN them, upright,
unaffected. Stun icons attach as they touch the void floor. World returns
with all of them planked on their tiles.

**63. Neural Hack** (`raceNeuralHack`, Android) — `code`
Glyph-rain void: the victim rendered in wireframe-green (material swap) as
cascading code pours THROUGH their silhouette. The android stands off-frame-
edge, one hand raised, fingers typing on nothing. A progress bar over the
victim's head: `ROOT ACCESS… 97%… 98%…` — cut back to reality at 99%. It
never shows 100. Stagger icon lands.

**64. Migraine** (`raceMindCrush`, Telepath) — `abyss` (flash-safe)
Black void, victim clutching their head (`hitHeavy` held mid-frame) while a
white crack-glyph SPIDERS across the darkness behind them — one slow fracture
line per 300ms, never strobing. Each crack = a low sub-bass pulse. The
M.ATK-down lands as the cracks all light at once (single 300ms glow, 3Hz-safe)
and the world snaps back.

**65. Devour Soul** (`raceVoidContract`, Demon) — `bloodlust`
Red void: a glowing wisp (the soul) is DRAWN out of the victim's chest along
a curved path into the demon's open jaw — the lifeDrain tether made literal
and center-frame. The victim dims (brightness-down on their material) as the
demon brightens. Heal number pops on the demon INSIDE the void, damage on
the victim after the world returns — the two halves of the drain get their
own stage each.

**66. Exorcism** (`exorcism`, Priest) — `bone`
White void: priest and victim alone, the priest advancing one slow step per
verse (chant audio), crucifix held to LENS in the foreground of frame —
oversized, dominant. Unholy victims recoil against nothing (there's no
world to back into). The final word cuts reality back in WITH the damage —
the real world itself is the banishment.

**67. Hex of Agony** (`sharedHexOfToil`, Demon Princess) — `hex`
Violet void with the cursed sigil as the FLOOR, slowly rotating under the
victim's feet. The princess doesn't move — the sigil's outer ring spins up,
runes lifting off it one by one and orbiting the victim, then SNAPPING onto
their limbs like shackles (attach small rune decals to arm/leg bones). Every
future move/cast pain-proc flashes those shackle runes — the void beat
installs them, the status re-lights them.

**68. Lump of Coal** (`raceLumpOfCoal`, Santa) — `hearth`
Fireplace glow frame-left, snowfall frame-right; the victim alone in the
cozy void looking around confused (idle). Santa's arm ONLY enters from
off-frame, places a single lump of coal floating before them, pats it once,
withdraws. The coal ignites → Burn proc → world returns with the victim
singed. Wholesome dread.

## The 50 → 70 rule of thumb

Void stage entries are CHEAP once the system exists (a palette + one beat of
blocking each), so the gallery should keep growing past this list — any
debuff or drain with a strong fantasy is a candidate. The gate is scarcity:
one void beat per round, signatures only.

---

# I. FAMILY TREATMENTS — covering the other ~375 spells

The 70 above are bespoke. Everything else inherits a **family treatment**
keyed off `kind` (+ a few flags): one camera grammar, one animation slot
policy, one VFX skeleton per family — with a per-spell **flavor slot**
(palette, particle sprite, decal) so family members still read differently.
Implement as data: a `CINE_FAMILIES` table in battle.js consulted by
`doSpell` when no bespoke sequence exists; per-spell overrides live in an
optional `cine:` field on the spell def.

Census (all 445 spells):

| Family | Kinds (count) | Camera treatment | Notes |
|---|---|---|---|
| Single-target strikes | `damage` (86) | Tiered: WEAK/MEDIUM keep the current OTS two-beat; HEAVY+ add a 2-frame impact freeze; SEVERE/execute add **glam cam** kill-confirm if it kills | Flavor = existing spellType palettes; crits get the kill flare. Biggest family — do NOT slow it down, sharpen it |
| Ground AOE | `aoe`, `cross` (61) | Cast OTS → hard cut to **witness cam** over a unit INSIDE the blast, ring sweeps through frame → God shot for the aftermath print (scorch/ice/crater decals) | The witness cam is what makes AOEs feel dangerous instead of decorative |
| Self-nova | `barrage` (11) | Camera does a fast 90° **orbit** around the caster during the pulse — the nova chases the lens | Flavor = pulse color + status icons |
| Beams & lines | `line`, `linePush`, `splitBeam` (20) | **THE BEAM REEL** (section G): side dolly default, ¾ diagonal fallback, end-cap reverse for pierces | linePush adds victims skidding OUT of frame edge |
| Drains | `lifeDrain`, `leechSeed` (13) | **Side profile tether shot**: both actors in frame, the siphon stream crossing between them; victim dims, caster brightens; heal number lands on the caster's side of frame | Devour Soul (#65) is the void-stage deluxe of this grammar |
| Dashes | `dash` (11) | Existing chase cam + **side dolly** finish: the last tile cuts perpendicular so the impact crosses frame | Flavor = trail (ice wake, exhaust, shadow smear) |
| Leap strikes | `leapStrike` (7) | Crane UP with the leap, `[NEW: slow-mo]` 200ms apex hang, hard cut to reverse OTS on the victim as the shadow grows | Avalanche Strike (#19) is the template |
| Sky verticality | `skyThrow`, `skyDrop`, `skySlam` (8) | Crane + whip-pan grammar from Dragon Toss (#17) / Abduction Beam (#16) | Damage-scales-with-height families MUST show the height |
| Teleports & escapes | `teleport`, `escape`, `swap` (20) | The Instant Transmission rule (#41): NO travel shot — vanish beat, HARD CUT to arrival. Escapes add the decoy/afterimage on the origin tile; swaps cut twice (A's tile → B's tile) | Easing a teleport makes it a walk. Never ease |
| Terrain sculpting | `terrainCreate` (16) | God shot, build the wall/fissure/flood tile-by-tile with ~80–120ms stagger, camera settling only after the last tile | The stagger IS the spectacle — never pop terrain in one frame |
| Zones | `zoneDebuff`, `zoneHeal` (14) | God shot stamp: zone boundary draws itself as a perimeter line first, THEN fills; camera dips to ground level inside the zone for one beat (fog/ink/smoke rolls past lens) | Per-zone floor decal is the flavor slot |
| Deployables | `deployObject`, `deployTurret`, `deployPair`, `bomb`, `placeMirror`, seeds (19) | No camera move at all (placement is tactical, not dramatic) — but every deployable gets a 400ms **assembly micro-animation** (turret unfolds, seed burrows, mirror folds out of light) instead of popping in | War of the Worlds tripod (honorable mentions) is the deluxe |
| Delayed strikes | `delayed` (7) | Mark turn: target ring decal + one camera dip. Payoff turn: descent cam family (Nuke #8 is the ceiling; Artillery/Fire for Effect get the budget version — whistle SFX + three staggered impact cuts) | The dread gap between mark and payoff is the personality |
| Heals & support | `heal`, `selfHeal`, `healAll`, `revive`, `cleanse`, `manaRestoreAll`, `encore` (20) | Recipient-side **glam cam** (the Wish Granted rule #44: the RECEIVER gets the hero shot); healAll does one slow pan across the team with staggered heal pops | Revives get a 2-beat: darkness → first breath. Encore gets a literal spotlight cone + curtain-call bow (reuse `dodge` clip half-speed) |
| Buffs (self) | `buff` self-target (~20 of 43) | **Glam cam** quarter-orbit, aura ignition from the feet up | Flavor = aura color + one signature pose hold |
| Buffs (ally) | `buff` ally-target (~23 of 43) | Caster gesture beat → hard cut to recipient glam cam | Same grammar, two actors |
| Party cries | `warCry`, `aoeShield`, `shield` (20) | Camera pulls BACK to fit the whole affected group, buff wave expands as a visible ring, each ally does a small held pose as it passes | The wave passing through allies one-by-one (100ms stagger) reads as morale |
| Debuffs | `debuff` (32) | **Victim cam**: push-in toward the victim as the status icon materializes PHYSICALLY over them (falls, snaps, or crawls on — per status), camera dips 5° as it lands (the world literally looks down on them) | The icon arrival animation is the flavor slot: shackles snap, poison drips, charm kisses, stun stars orbit |
| Pulls & displacement | `pull`, `aoePull`, `displacement` (14) | Track the VICTIM, not the caster: camera rides the drag/knockback path (mini side dolly), wall-slam impacts get the 2-frame freeze | Black Hole (#5) is the aoePull ceiling |
| Multi-hits | `multiHit`, `ricochet` (9) | Hit 1–2 normal OTS; hit 3+ start alternating hard-cut angles (the Team Strike #14 rule, uncolored); ricochets whip-pan along each bounce | Rising pitch per hit — audio sells the count |
| Weather | `summonWeather` (4) | The Blood Rain crane (#38): sky shot, first particles hit the lens, return | Per-weather lens hit: raindrop, snowflake, sand grain, red streak |
| Recon | `scan`, `remoteView` (3) | God shot iris-out over the revealed area, fog tiles burning away from the center outward | Rangefinder gets a binocular-mask grade overlay |
| One-offs | `trickRoom`, `guard`, `rallyPull`, `raiseDead`, `utility`, `tuneFrequency`, `pulseLattice` (8) | Each already has (or deserves) a named entry — see #46, #10, #36, honorable mentions | The lattice/frequency pair should share a prism-light language |

**Priority inside this table:** Beams (visibility bug, 20 spells), Debuffs
(32 spells, one cheap grammar), Single-target HEAVY tier (the most-seen
moments in the game), then Teleports (the no-ease rule is nearly free).

---

## Honorable mentions (bespoke-worthy, next in line)

| Spell | One-line hook |
|---|---|
| `raceChivalry` (Knight) | Reactive intercept: slow-mo dash INTO the attack's path when the pledge triggers |
| `raceSpellsteal` (Wizard) | The stolen spell's icon physically yanked out of the victim's head on a thread |
| `racePulseLattice` (Machine Elves) | Beam network lights prism-to-prism in sequence before the burst — show the graph |
| `raceWarOfTheWorlds` (Martian) | Camera cranes up into a sky filling with 3D saucers; the V-formation strafes the zone raining heat-rays as the god shot slams down |
| `raceDeathGaze` (Occulus) | Extreme close-up of the iris dilating; the beam fires FROM the camera's position |
| `raceCropCircle` (Grey) | Straight-down God shot as the pattern mows itself in concentric strokes |
| `raceRocketFist` (Robot) | Fist-cam: track the flying fist, knuckles in foreground, victim growing in frame |
| `raceGrapple` (Pirate) | Rope-cam: ride the hook out, then reverse as the winch hauls the victim in |
| `raceTuneFrequency` (Machine Elves) | The whole lattice re-colors in a wave from the caster outward, one prism per beat |
| `raceBloodFrenzy` (Werewolf) | Auto-targets lowest HP: predator cam sweeps across ALL visible enemies, locks the weakest |

## Suggested build order

1. **`[NEW: side dolly]` + the Beam Reel defaults** — fixes a CURRENT
   visibility flaw affecting 20 spells the moment it lands. Do this first;
   it's a bug fix wearing a cinematic's clothes.
2. **`[NEW: void stage]` + 3 palettes (`bsod`, `abyss`, `valentine`)** —
   ships #28 Blue Screen, #43 No Mercy, #57 Charm; the system then grows a
   palette at a time toward the full gallery (section H).
3. **`[NEW: grade]` + `[NEW: freeze-frame]`** — #21 To Be Continued, #42
   Indomitable Will, #2 Absolute Zero, and the HEAVY-tier impact freeze for
   the whole single-target family.
4. **Family treatments: Debuff victim-cam + Teleport no-ease rule** — 52
   spells upgraded with two data-table entries.
5. **`[NEW: slow-mo]`** — #1 High Noon, #47 Take Aim, #30 Hail Mary, leap
   apex hangs.
6. **`[NEW: face cam]` + `[NEW: caster fade]`** — **Boo** (the flagship),
   #31 Sleep Paralysis, #41 Instant Transmission.
7. **`[NEW: dolly-zoom]`** — #3 Ego Death, #5 Black Hole, #50 Singularity.
8. Then the bespoke one-offs (#10 Knights of Round, #20 Great Flood, #37
   Weigh the Heart…) in whatever order playtests say players see most often.

Every primitive lands 3–20 spells, so personality compounds fast — and every
sequence must answer RULE #2's question before it ships: *what does Player 2
see when this fires?*
