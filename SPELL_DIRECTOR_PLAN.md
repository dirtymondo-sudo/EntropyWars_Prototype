# THE SPELL DIRECTOR — every spell directed, every hit felt

> The user's brief (2026-09-23): *"Some spells are lacking in VFX, presentation
> and juice compared to other spells. A lot of spells use the same Meshy rigged
> animations. A lot of spells have camera / cinematography that hurts the
> presentation of the VFX, the caster or the target — might be the forced
> two-shot interfering with other camera stuff. I want every spell to have a
> director like the finishers. A pass on all VFX, combo attacks included
> (they lag the Entropy Strikes and the Finishers). Focus: (1) improved VFX,
> (2) camera angles and movement, a director for every spell, (3) more
> specific animations from the libraries + a list of 25–30 new animations I
> can create, (4) juice, impact, the cool factor. The target: a trippy
> psychedelic epic fantasy sci-fi apocalyptic fever-dream esoteric nostalgic
> PS1-era cult-classic JRPG."*

This is THE doc for spell presentation from now on. `SPELL_CINEMATICS.md` stays
the catalogue of the 77 bespoke sequences and the camera vocabulary it built;
`FINISHER_PLAN.md` stays the finisher catalogue. Read this doc first, append
to §10 every session.

---

## 1. Diagnosis — measured, not guessed (2026-09-23)

A census script (§11) ran over every playable spell: `SPELL_LIBRARY` plus
every `RACE_ABILITIES` list, deduplicated to **519 spells**. It checked each
spell's `kind`, its camera family, its bespoke sequence, its VFX recipes in
the runtime `SPELL_MAP`, its registered 3D signature, and the cast clip
`classifySpellAnimKind` picks.

### 1.1 The camera — three rigs, one table, and a collision

There are three shot rigs in battle.js, not one:

| Rig | Who uses it | Consults the per-spell director table? |
|---|---|---|
| `_playCineActionShot` (the OTS two-beat, via `playOffensiveActionCamera`) | damage, debuff, aoe/cross, line, pull, swap, possess, link, lifeDrain, barrage with victims, leapStrike, terrainCreate… | **yes** — `_cinePlaySpellSequence` (bespoke first, family second) |
| `_playSelfCastHeroShot` (via `_spellFocusCamera`, self tile) | self buffs, selfHeal, guard, trickRoom, escape, warCry, transform… | **no** |
| `_playSupportCineShot` (via `_spellFocusCamera`, other tile) | heal, buff, shield, cleanse, deploys, zones, summons, runes, remote views… | **no** |

Consequences:

1. **The families for non-offensive kinds are dead code.** `support`, `buff`,
   `partyCry`, `zone`, `weather`, `recon`, most of `blink` and `delayed`
   never run: their kinds all take the focus rigs. That is **~40 % of the
   game's spells** (the census counts 210 spells on focus kinds).
2. **Bespoke sequences on focus kinds never play.** They are defined in
   `CINE_SEQUENCES` but unreachable: `raceHowl`, `raceAwakening`,
   `raceWishGranted`, `raceTrickRoom`, `raceReassemble`, `raceChivalry`,
   `raceEject`, and the tuneFrequency / pulseLattice / rallyPull / raiseDead
   / zoneDebuff sequences. `raceInstantTransmission` and `raceRamCharge` are
   probably unreachable too. The flagship sequences the user remembers
   designing are not on screen.
3. **The families that DO run double-cut.** `_playCineActionShot` schedules
   its beat 2 (the reverse cut on the victim, or the drift / wide cut) at
   `cutMs`. The family layer schedules its own shot at `cut + 0…30 ms`: the
   witness cam, the side dolly, the face cam, the glam cam or the god shot.
   Two cuts land in the same breath, and whichever timer fires last wins the
   frame. **That is the "forced two-shot interfering" the user sees.**
4. **Bespoke sequences are clobbered too.** A bespoke sequence LAYERS on the
   stock shot and never takes the camera (only the finishers, High Noon and
   To the Moon call `cineOwnShot`). Take Boo, the flagship: its face-cam pan
   (400–1900 ms) is interrupted by the stock beat 2 at ~1.4 s, as a hard cut
   or a focal drift onto the victim. The horror beat never holds.
5. **VFX retargets yank the camera.** `_cineRetargetShot` (ricochet
   hand-offs, flung bodies, throws) moves the camera mid-sequence unless the
   shot is owned, and only a handful are.
6. **Aftermath beats land after the shot.** Some family beats fire at `tail +
   60 ms`, and the shot's busy release is at `tail + 210 ms`. The god shot
   over a crater starts as the turn loop takes the camera back.
7. **26 kinds have no family at all.** These are deployables, summons,
   possess / link / transfer, transform, steal, tackle, doors, trickRoom and
   utility: 46 spells with the stock shot or a flat pan and nothing else.

### 1.2 The body — four clips play 84 % of the game

| Cast slot (clip) | Spells | Notes |
|---|---|---|
| `castSupport` (MAL `mage_soell_cast_7`, arms spread) | **129** | every buff, debuff, mark, curse, stealth, deploy… |
| `castAOE` + `castUltimate` (MAL `Charged_Spell_Cast`) | **141** | 70 big spells + 71 capstones on the SAME clip |
| `castMagic` (MAL `mage_soell_cast_3`, one-arm push) | **69** | every bolt, beam, drain, breath |
| `castMelee` (UAL1 `Sword_Attack`, a spinning sword slash) | **59** | a wing gust, a tail whip, a bite, a charge, a stomp — all swing a sword |
| `castRanged` (MAL `Cowboy_Quick_Draw_Shooting`) | 37 | rifles, rockets and cannons all quick-draw a revolver |
| everything else (slam, heal, throw, punch, claw, arrow, kick, plant, deploy, dash, tackle) | 84 | |

The libraries hold **111 clips** (UAL1 43 · UAL2 43 · MAL1 20 · MAL2 5).
Spells use **~22**. Clips that exist and are never cast:
`Spell_Simple_Enter / Idle_Loop / Exit` (a real channel),
`Idle_Rail_Call` (a beckon / call-out), `Farm_Harvest` (a reap),
`Farm_Watering` (a pour), `Sword_Heavy_Combo`, `Sword_Regular_A/B/C`,
`Punch_Jab`, `Melee_Hook`, `Punch_Combo_1 / _5`, `Hit_Knockback`,
`Hit_Head`, `Hit_Chest`, `Idle_Shield_Break`, `Sword_Block`, `NinjaJump_Start / Idle_Loop / Land`,
`Jump_Start / Loop / Land`, `Chest_Open`, `Interact`, `PickUp_Table`,
`Push_Loop`, `Crouch_Idle_Loop`, `LayToIdle`, `Idle_Torch_Loop`,
`Idle_Lantern_Loop`, `Idle_TalkingPhone_Loop`, `Pistol_Reload`,
`Dance_Loop`, `Idle_FoldArms_Loop`, `Yes`, `Idle_No`, `Slide_Start`. That is
twenty-plus new cast verbs for free (Phase 2).

### 1.3 The VFX — identity is thin outside the signatures

| | Spells |
|---|---|
| Wear a registered 3D signature (`_spell3DGeometry`) | 146 |
| Have a bespoke `CINE_SEQUENCES` director | 87 (≈ 20 unreachable, §1.1) |
| Every effect id they fire is SHARED with other spells (a family alias or a palette recipe — no identity of their own) | **120** |
| No `SPELL_MAP` row at all (the kind branch's generic look only) | 18 |
| Capstones (r4★) with no signature AND no bespoke director | **44** |

The shared-only list covers most buffs, most `terrainCreate` rows, the
`sharedPoisonSwamp` / `sharedFlashFreeze` rows (6 races each), the arrow
rows, Ki Wave, Freeze Breath, Chemtrails, Boulder Hurl, the grenades and
Charm. §11 regenerates the list.

### 1.4 The combos — the poor cousins

The 21 DUAL TECHs (`COMBO_REGISTRY`: 6 same-type + 15 cross-type) get:
the splitscreen cut-in with the name slam, two magic circles, the
converge streams, the stock two-beat camera (no spell id, so **no family
and no director**), a hitstop, and an impact made of 2–4 stock library
calls (`sigLightPillar3D`, `sigShockRing3D`, `sigScreenFlash`…). Compare the
Entropy Strike (six directors, siren / pane / world / enemyCam / lead / strike
/ resolve, void stages, grades, a world event) and the Finishers (103
directors, a bespoke signature each, a composed camera from the first frame
to the restore). A combo spends two units' turns and looks like one spell.

---

## 2. The look — the fever-dream bible

The direction in one line: **a PS1 cult-classic JRPG summon, remembered
through a fever.** In practice:

| Pillar | What it means on screen | Tools we have / need |
|---|---|---|
| **The summon grammar (FF7–9, Xenogears, Legaia, Chrono Cross)** | The camera ORBITS the caster during the charge. The world dims to a spotlight. Big geometric sigils spin up. The payoff is a WORLD EVENT, not a particle puff. The name card slams. Damage numbers bounce. | have: magic circles, void stage, spot-dim grade, name chrome · need: the orbit charge (Phase 1 shots), world events per family (Phase 3) |
| **PS1 texture** | Additive billboards with hard edges and flipbooks. Flat-shaded polygon shards. Low-poly spheres with scrolling textures (the materia look). Ribbon trails. Vertex jitter. Palette-limited colour. Dither. | have: the retro filter (pixel / dither / levels), `_spawn` billboards · need: shard kit, scrolling-texture orbs, ribbon trails (Phase 3) |
| **Psychedelic** | Hue cycling, kaleidoscope mirror, frame feedback trails, chromatic aberration, UV warp, datamosh smear, fisheye bulge on impact. | have: `ThreePost.spellGrade` (dim / trip / hue / warp / chroma / tint), `spellGradeKick`, the cinematic pass's radial motion blur · need: THE FEVER PASS (feedback, kaleido, ripple, bulge, datamosh — Phase 3) |
| **Esoteric** | Sacred geometry (Metatron, Flower of Life, the tesseract), alchemical and planetary glyphs, tarot cards, sigils burnt into the board, all tied to the SIX TYPES. | have: sigils in a few signatures · need: a glyph atlas per type (Phase 3) |
| **Apocalyptic sci-fi** | CRT scanlines, VHS tracking tears, orbital strikes, warning klaxons, terminal inserts, whiteout nukes. | have: grades (`terminal`, `scope`, `whiteout`), inserts, the flyover strike · extend per family |
| **Nostalgic** | Warmth: film grain, a light leak, the sepia memory, bloom that sings. | have: bloom (HDR, the look system), grades · tune |

**THE SIX TYPES as art direction** (each spell reads its own type first,
its element second):

| Type | Colour | Geometry | Motion | Sound | Grade |
|---|---|---|---|---|---|
| human | steel / warm white | straight lines, muzzle stars, tracers | snappy, mechanical | report, clang | `speedlines` |
| alien | acid green / chrome | saucers, crop-circle rings, perfect spheres | levitation, hum | theremin | `cool` |
| divine | gold / white | halos, rings, feathers, columns of light | descending, slow | choir, bell | `bone` / whiteout |
| unholy | crimson / black | pentagrams, thorns, bones, smoke | rising from below, crawling | drone, whisper | `crimson` |
| tech | cyan / magenta | grids, wireframes, glitch blocks, scan lines | stepping, digital | chirp, static | `terminal` |
| anomaly | violet / prismatic | fractals, kaleidoscope, Möbius, impossible geometry | warping, looping | reversed audio | `hue` |

**Juice rules** (every director applies them, Phase 6 tunes them):
- **Hitstop scales with weight:** light 0 · standard 40 ms · heavy 90 ms ·
  ultimate 150 ms · kill +60 ms.
- **One cut per beat.** A beat gets exactly ONE camera move. Two moves in the
  same 50 ms is a bug.
- **The camera serves the hero part.** The hero part is the thing that
  moves: the bolt, the beam head, the falling star, the flung body (the
  Director's Pass rule, SPELL_CINEMATICS §I).
- **Anticipation → action → reaction.** The charge sells the hit, and the
  victim's reaction (Phase 7 clips) sells the charge.
- **Contrast.** A big spell earns a dim world (the spot-dim grade) so its
  light reads. Never bloom everything.
- **Scarcity.** At most ONE void stage per round. At most ONE big grade per
  cast.

---

## 3. THE SPELL DIRECTOR — the architecture

**Every cast is run by exactly ONE director, from its first frame to the
restore, whichever rig it takes.**

```
doSpell → the kind branch → ONE of the three rigs (offensive · self · support)
             │
             └─ spellDirect(spellId, ctx)          ← the ONE entry (all three rigs)
                  1. SPELL_DIRECTOR_ROWS[id].family  ← a per-spell remap (data)
                  2. CINE_SEQUENCES[id]              ← a bespoke director
                  3. SPELL_FAMILY_DIRECTORS[family]  ← the family director for the kind
                  → never null: every spell resolves (the test insists)
```

**Ownership rules** (the fix for §1.1 items 3–5):
- A FAMILY director takes the shot at t = 0 (`c.own()`). The stock rig's
  later beats (beat 2's cut, the drift, the wide cut) are skipped. The
  director composes its own payoff, and `c.stockHit()` replays the stock
  beat 2 on demand when that IS the right shot.
- A BESPOKE director takes the shot LAZILY. The first camera move it makes
  inside a directing context (`_cineAt` callbacks, or the synchronous call)
  claims the shot, and from that frame the stock beats are skipped. A
  bespoke sequence that only adds a grade or a freeze keeps the stock shot
  under it.
- **Retargets** (VFX-driven `_cineRetargetShot`) are a separate permission.
  `cineOwnShot` (the finishers' explicit take) blocks them; a family director
  allows them only where the hero part moves (dash, sky, displace,
  multiHit / ricochet).
- The chrome (letterbox + name + TOTAL), the fog gate, the restore and the
  impact kick stay the rig's.

**The director's clock** is the rig's real clock, not an estimate:

| field | offensive rig | self rig | support rig |
|---|---|---|---|
| `sourceHold` | the cast hold (weight-paced) | 640 ms (the aura pop) | the gift's wind-up |
| `travelMs` | the projectile's flight | 0 | the gift's flight |
| `targetHold` | the impact hold | the rest of the hold | the landing hold |
| `cut` | the stock cut frame (`_cineCutMs`) | the pop | launch + half the flight |
| `impact` | `sourceHold + travelMs` | the pop | the landing |
| `totalMs` | the shot's end (busy release) | — | — |

**Every beat lands inside `[0, totalMs)`** (§1.1 item 6). A director that
needs longer asks for an extension (Phase 1b: `c.extend(ms)` holds the busy
flag and the turn loop's wait).

**The per-spell row** — `SPELL_DIRECTOR_ROWS[spellId]` (battle.js, data) —
is the tuning surface for every spell, so 519 spells get individual
direction without 519 functions:

| field | meaning |
|---|---|
| `family` | take another family's director (a steal is a strike, a door breach is a blink) |
| `payoff` | the named shot for the payoff beat (`glam`, `witness`, `godShot`, `faceCam`, `reverseOts`, `sideDolly`, `bulletCam`, `crane`, `skyWatch`, `orbit`, `lowTile`) |
| `opener` | the named shot for the charge (`stock`, `orbit`, `lowHero`, `faceCam`, `crane`, `skyWatch`) |
| `grade` / `gradeMs` | one cinematic grade at the payoff |
| `insert` | an insert card (text + kind) |
| `void` | a Void Stage palette at the payoff (scarcity rules apply) |
| `slow` | `[scale, ms]` slow-mo on the impact |
| `freeze` | hitstop ms on the impact (overrides the weight table) |
| `anim` | the cast clip kind (Phase 2 — overrides `classifySpellAnimKind`) |
| `vfx` | the Phase 3 look overrides (sigil, shard colour, fever kind) |

**Readout:** `window.SpellDirector` = `{ resolve(id), catalogue(), log }`.
The log keeps the last 40 casts: spell, director, source, rig, owned, the
beats fired. **Read it first on any "the camera did something weird" report.**

**RULE #2 (online):** every rig is already relayed with the spell id
(`offensive`, `support-cine`, `spell-focus-cam`). The guest resolves the same
director off the same id, and every beat is fog-gated per viewer
(`_cineActorVisible`). Phase 1 fixes the one hole: a bare
`_spellFocusCamera(unit, x, y)` call relayed `spellId: null`, so the guest's
self shot had no director.

---

## 4. The family directors (Phase 1)

Each family director is a whole shot. Every one owns the camera at t = 0,
places ONE payoff shot, and puts its aftermath inside the window.

| Family | Kinds | Opener | Payoff (one cut) | Aftermath | Retargets |
|---|---|---|---|---|---|
| `strike` | damage, magic, steal | stock OTS / low hero (weight) | stock beat 2 (reverse cut or pair drift) | heavy: hitstop + aberration kick · ultimate: + low reverse on impact · kill: slow-mo + glam confirm | no |
| `groundAoe` | aoe, cross | stock | the witness cam if a witness stands near, else the wide stock cut | glide to the god shot over the print at impact + 40 % of the hold | no |
| `selfNova` | barrage | an ORBIT around the caster through the charge (the summon grammar) | the wide cut on the victims | — | no |
| `beam` | line, linePush, splitBeam | stock (held through the launch) | side dolly riding the head | a pierce gets the end-cap reverse | no |
| `drain` | lifeDrain, leechSeed | stock | the side-dolly tether hold | push-in, then a face cam on the caster as the heal lands | no |
| `dash` | dash, tackle | stock | side dolly hold on the last tile | — | **yes** |
| `leap` | leapStrike | crane up with the leap + apex slow-mo | reverse OTS on the victim | — | no |
| `sky` | skyThrow, skyDrop, skySlam | crane | reverse OTS | — | **yes** |
| `blink` | teleport, escape, swap, doorBreach, warpRune | face on the caster | VANISH (fade) → hard cut to the arrival face cam (never eased) | — | no |
| `terrain` | terrainCreate | stock | god shot (the tiles build under it) | slow push-in | no |
| `zone` | zoneDebuff, zoneHeal | stock | god shot stamp | the lens dips inside the zone | no |
| `delayed` | delayed (the mark turn) | stock | god shot on the doomed tile | push-in | no |
| `support` | heal, selfHeal, healAll, revive, cleanse, manaRestoreAll, encore | face on the giver | glam cam on the RECEIVER (the Wish Granted rule) | slow orbit while the number lands | no |
| `buff` | buff, guard, utility | face on the giver | glam cam on the receiver (self: the low glam + orbit at the pop) | — | no |
| `partyCry` | warCry, aoeShield, shield, rallyPull, cleanseArea | face on the caster | pull back to fit every ally in the radius | — | no |
| `debuff` | debuff | stock | face cam on the victim + dip | — | no |
| `displace` | pull, aoePull, displacement | stock | side dolly hold on the victim's path | ride the body | **yes** |
| `multiHit` | multiHit, ricochet | stock | stock cut, then alternating hard angles from hit 3 | — | **yes** |
| `weather` | summonWeather | crane to the sky | dim grade as the weather lands | — | no |
| `recon` | scan, remoteView | stock | god shot + scope grade | — | no |
| **`deploy`** *(new)* | deployObject, deployPair, deployTurret, bomb, placeTrap, placeMirror, seeds, doors | face on the caster | the LOW TILE shot: ground level at the device, ¾ from the caster's side, a slow push while it assembles | — | no |
| **`summon`** *(new)* | summonUnit, raiseDead | stock | THE SUMMON REVEAL: god shot high over the tile, then a crane down to a low hero shot as it stands | — | no |
| **`control`** *(new)* | possess, link, shadowRealm, transfer, cannibalize | stock | face cam on the victim + a Vertigo dolly zoom (the mind snapping) + hue grade | — | no |
| **`transform`** *(new)* | transform | face on the caster | glam cam, a 120° orbit, a whiteout freeze on the swap frame | — | no |
| **`world`** *(new)* | trickRoom, tuneFrequency, pulseLattice | crane | god shot over the board | — | no |

---

## 5. The phases

Each phase ships on its own and is playable. The order is by leverage:
the director is the socket every later phase plugs into.

### Phase 1 — THE DIRECTOR (camera) · *this session*
1. `spellDirect(spellId, ctx)` is the one entry, called from all three rigs.
   The self rig and the support rig now run the director, which brings back
   the dead families and the ~20 unreachable bespoke sequences.
2. Ownership: family directors own at t = 0; bespoke directors claim lazily
   on their first camera move; `c.stockHit()` replays the stock beat 2;
   retargets become a separate permission. This fixes the double cut.
3. Coverage: the family table covers EVERY kind (five new families: deploy,
   summon, control, transform, world). `SpellDirector.resolve(id)` is never
   null, and the test walks all 519 spells.
4. The family directors are rewritten as whole shots (§4). Aftermath lands
   inside the window.
5. `SPELL_DIRECTOR_ROWS`, the per-spell tuning table (§3), with its first
   rows.
6. The readout (`window.SpellDirector`), the online spell-id fix, the tests,
   and a probe pass (`playtest_spellcam.js`).

### Phase 2 — THE BODY (existing clips, a verb per spell)
1. New cast slots from the 20+ unused library clips (§1.2):
   - `castChannel`: Spell_Simple_Enter → Idle_Loop held through the beam →
     Exit. For beams, drains and breath.
   - `castCall`: Idle_Rail_Call. For summons, war cries and call-downs.
   - `castReap`: Farm_Harvest. For reaps, harvests and soul drains.
   - `castPour`: Farm_Watering. For splashes, poisons and potions poured on
     an ally.
   - `castHeavySlash`: Sword_Heavy_Combo / Sword_Regular_C. For
     Excalibur, Dragon Slash and blade capstones.
   - `castSlashLight`: Sword_Regular_A / B.
   - `castJab` / `castHook`: Punch_Jab / Melee_Hook.
   - `castPunchCombo2`: Punch_Combo_1 / _5.
   - `castLeap`: NinjaJump_Start → Idle_Loop → Land. For leap strikes and
     sky drops.
   - `castGuard`: Sword_Block / Shield_OneShot.
   - `castOpen`: Chest_Open. For presents, loot and Pandora.
   - `castTouch`: Interact. For runes, mirrors, doors and ley lines.
   - `castPush`: Push_Loop, trimmed. For shoves.
   - `castLantern`: Idle_Lantern_Loop / Idle_Torch_Loop. For reveals, scans
     and divine light.
   - `castPhone`: Idle_TalkingPhone_Loop. For artillery, air support and the
     general's call-ins.
   - `castReload`: Pistol_Reload. For Extended Clips and reloads.
   - `castDance`: Dance_Loop. For Space Disco and Encore.
   - `castSmug`: Idle_FoldArms. For invulnerable self buffs.
   - `castCheer`: Yes. For rallies.
   - `castStealth`: Crouch_Idle_Loop. For camouflage and sneaking.
   - Victim reactions: `hitKnockback` (Hit_Knockback) for displacement,
     `hitHead` / `hitChest` for light hits, `guardBreak`
     (Idle_Shield_Break) for a broken shield, `reviveRise` (LayToIdle) for
     revives.
2. **THE ANIM ROUTER:** `SPELL_DIRECTOR_ROWS[id].anim` beats
   `classifySpellAnimKind`, and a per-kind policy table replaces most of the
   text regexes. Every one of the 59 `castMelee` spells gets the verb it
   actually performs: gust, whip, bite, gore, stomp, charge.
3. Contact sheets (`node anim-sheets.js`) for every new slot, with
   `strikeAt` read off them (THE STRIKE FRAME rule).
4. The census tool reports the clip spread. Target: no clip plays more than
   15 % of spells.

### Phase 3 — THE FEVER (VFX)
1. **THE FEVER PASS** (three-post.js): a screen-space effect layer driven by
   `ThreePost.fever({ kind, at, ms, amt })`. Kinds:
   - `ripple`: a radial shockwave distortion from a world point.
   - `bulge`: fisheye on the impact.
   - `feedback`: frame feedback afterimages, the psychedelic trail.
   - `kaleido`: an N-fold mirror.
   - `datamosh`: block smear.
   - `vhs`: a tracking tear.
   - `posterize`: palette crush with dither.
   - `invert`: a negative flash.
   - `burn`: a film-burn light leak.

   All are scaled by the Impact FX slider, gated by reduced motion, with no
   strobe over 3 Hz.
2. **THE PS1 KIT** (three-vfx-effects.js):
   - flat-shaded shard bursts;
   - scrolling-texture orbs (the materia look);
   - ribbon trails on bolts and blades;
   - the glyph atlas: six type sigil sets drawn on one canvas (sacred
     geometry, alchemy, circuitry, pentacles, crop circles, fractals);
   - flipbook billboards with hard edges.
3. **FAMILY VFX SKELETONS.** Every family's windup → release → travel →
   impact → aftermath is re-authored with the kit and the type table (§2).
   Every aoe leaves a print decal, every beam leaves a scorch line, and
   every buff ignites from the feet up.
4. **THE IDENTITY PASS.** Each of the 120 shared-only spells and the 18
   rowless spells gets at least ONE element of its own: a sigil, a shard
   colour, a signature geometry or a fever kind, carried on its row's `vfx`
   field. The census's shared-only count goes to 0.
5. **THE HIT READ.** Damage numbers get a type-coloured punch-scale, crits
   stamp, weakness hits flash the type glyph, and a kill leaves an afterglow
   silhouette.

### Phase 4 — THE DUAL TECHS (combos get directors)
Each of the 21 combos becomes a director on the Entropy-Strike skeleton:
siren · the splitscreen charge (kept) · a WORLD EVENT stage · the strike ·
the resolve. A combo passes its own `spellId` (`combo:<key>`), so it runs
through the spell director and the relay too. Pitches:

| Combo | The world event |
|---|---|
| Celestial Chorus | the sky splits into a choir of halos, a column of light per victim, feathers fall |
| Abyssal Pact | a pentagram opens under the victim, two chains of blood run back to both casters |
| Reality Fracture | the board shatters like glass around the victim, each shard a mirror reflecting the wrong scene |
| System Override | the world goes wireframe (tech void), the victim's model is overwritten by scanlines |
| Combined Arms | a two-angle crossfire: a bullet-time split shot, one camera per caster, the bullets meet |
| Cosmic Convergence | a saucer pair above the board fires into a focusing lens; the beam pierces the line |
| Twilight Reckoning | half the board in daylight, half in night, the line between them sweeps over the victim |
| Purifying Pulse | a white tide rolls out from the victim, colour washes back into the world behind it |
| Holy Ordnance | an angelic artillery barrage: gilded shells with halos, whistling in |
| Crusader's Charge | both casters charge in slow-mo on converging side dollies, lances of light |
| Astral Judgment | constellations draw themselves over the victim, the stars fall along the lines |
| Chaos Eruption | the ground boils into a kaleidoscope pit, the victim is spat out |
| Dark Protocol | a corrupted terminal insert types the victim's deletion, then red glitch blocks eat the tile |
| Blood Pact | twin blades in red slow-mo, a blood moon in the grade |
| Void Rift | a tear in the air, the victim falls through into a starfield void stage |
| Glitch Bomb | the frame datamoshes, the victim's tile tiles itself across the board for a beat |
| Primal Surge | the casters' shadows grow into giant beasts that strike |
| Dimensional Tear | a portal on each side of the victim, the attack goes through both |
| Tactical Strike | a drone POV painting the target, then the strike from the drone's eye |
| Plasma Cascade | a plasma wave cascading down a staircase of floating panels |
| Hybrid Assault | the alternating flurry with a camera per hit, the finisher hit in a void flash |

### Phase 5 — THE CAPSTONES (44 bare ultimates)
A bespoke director + signature for each capstone with neither (§1.3), on the
finisher pattern (the director names its shots, the signature is one
`_sigRunOwned` group, and the timers go through `_fxDelay`). Order: by how
often each is seen (the AI's pick rate × the race's popularity).

### Phase 6 — THE JUICE PASS
Tune the hitstop table and the shake language. Tie audio to the strike
frame on every family. Punch-scale the damage numbers. Add status-impact
flourishes: a burn catches, a freeze cracks, a shock arcs. Seed kill
confirms per weight. Add a "the world flinches" pass: props and trees
sway on a heavy impact, dust falls. Check the frame rate on every family at
the Low perf tier.

### Phase 7 — THE NEW CLIPS
Wire the user's new animations (§6) as `UAL_SLOTS` / MAL3 slots through the
anim router, read their strike frames, and hand the reactions to the victim
side of every family director.

---

## 6. The 30 animations to create (for the user)

**How to make them so they drop in:** export every clip FROM THE SAME
RIG as MAL1 / MAL2, the male sniper (`Meshy_AI_sniper_biped`), `withSkin`,
one file per clip named `…_Animation_<ClipName>_withSkin.glb`. They are then
consolidated into ONE animation-only `MAL3_Sniper.glb` with the MAL2 recipe
(`build_mal2.js`, PLAYTEST_NOTES "MAL library"). In-place loops only (no root
travel; the board moves the unit). Keep one-shots short: the board plays them
at 1–2.5×. A clean anticipation → strike → recovery arc matters more than
length; the strike frame gets read off the contact sheet.

Ordered by payoff (how many spells each one reaches, from the census):

| # | Clip name | What it is | Loop? | Reaches (spells) |
|---|---|---|---|---|
| 1 | `Beam_Channel` | Two hands cupped at the hip, thrust forward, HOLD pushing (the Kamehameha stance) | one-shot with a long hold | **35** beams, breaths, lasers, cannons |
| 2 | `Summon_Skyward` | Both arms sweep up, hold at the sky, pull down hard (calling something out of the sky) | one-shot | **26** meteors, storms, orbitals, call-downs |
| 3 | `Curse_Point` | An accusing finger / open palm thrust at the victim, the body leaning in, a small recoil | one-shot | **49** debuffs, hexes, marks, charms |
| 4 | `Power_Up_Flex` | Fists clenched at the waist, the chest pushing out, a shout, an aura stance (DBZ power-up) | one-shot | **45** self buffs, transforms, guards |
| 5 | `Roar_Howl` | Head thrown back, arms out, a chest-out roar | one-shot | **21** war cries, howls, fears, roars |
| 6 | `Prayer_Kneel` | Drop to one knee, hands together, head bowed, then look up with the arms opening | one-shot | **24** heals, blessings, revives, cleanses |
| 7 | `Telekinesis_Lift` | One arm raised, fingers splayed and straining, lifting something heavy | loopable hold | **23** pulls, levitations, gravity, kinetic hurls |
| 8 | `Telekinesis_Throw` | From the lift, a sweeping arm throw to the side | one-shot | the same 23 (the release) |
| 9 | `Earth_Raise` | Squat, palms down, then drive both palms UP as if lifting a wall out of the ground | one-shot | **18** walls, pillars, ramparts, terrain |
| 10 | `Nova_Spin` | A 360° spin releasing energy, arms out | one-shot | **25** novas, pulses, barrages |
| 11 | `Charge_Run` | Head down, shoulder forward, a bull-charge run | loop | **29** charges, rushes, rams, gores |
| 12 | `Drain_Pull` | Both arms forward palms up, pulling energy IN, leaning back, the chest lifting | loopable | **17** drains, siphons, leeches |
| 13 | `Summon_Circle` | Kneel, trace a circle on the ground with one hand, rise with the arm up | one-shot | **21** summons, turrets, raise dead |
| 14 | `Blink_Vanish` | A crouch-and-snap vanish pose (two fingers to the forehead, the Instant Transmission) | one-shot | **24** teleports, escapes, swaps |
| 15 | `Heavy_Overhead_Smash` | A two-hand overhead hammer / greatsword smash straight down | one-shot | **10** smashes + blade capstones |
| 16 | `Rifle_Aim_Fire` | A shouldered long gun: aim, fire, recoil (not a revolver quick-draw) | one-shot | **6** snipers + the gun capstones |
| 17 | `Dual_Pistol_Spray` | Two guns forward, a sustained spray, walking the fire | loopable | **9** Fan the Hammer, Suppressive Fire, Choppa, Drive-By |
| 18 | `Shoulder_Launcher` | Kneel, shoulder a launcher, fire, recoil | one-shot | **8** rockets, missiles, cannons |
| 19 | `Lunge_Bite` | Head and body snap forward in a bite, then yank back | one-shot | **10** bites, jaws, devours |
| 20 | `Tail_Sweep_Spin` | A low 360° spinning sweep (leg / tail) | one-shot | tail whips, sweeps, cyclones |
| 21 | `Iaido_Dash_Slash` | Sheathed draw → a slash-through dash → a pose with the back to the victim | one-shot | **11** slashes, sneak slash, dash cuts |
| 22 | `Psychic_Temples` | Fingers to the temples, head tilt, a strain and release | one-shot | **8** mind spells (telepath, psychic, hypnosis) |
| 23 | `Siren_Scream` | Hands framing the mouth or arms thrown back, a scream / song | one-shot | **8** sonic, songs, shrieks, lullabies |
| 24 | `Levitate_Rise` | The feet leave the ground, arms out, a slow rise and hover | loop | flight buffs, ascensions, divine forms |
| 25 | `Evil_Laugh` | Head back, shoulders shaking, a villain cackle | one-shot | villain buffs, curses, taunts |
| 26 | **REACT** `Launched_Air` | The victim is knocked UP into the air, tumbles, lands on the back | one-shot | every launcher, sky throw, uppercut, big impact |
| 27 | **REACT** `Knockdown_Getup` | Knocked flat, a beat on the ground, then gets up | one-shot | heavy hits, stuns, slams |
| 28 | **REACT** `Electrocuted` | A rigid spasm, shaking in place | loop | lightning, tech, tasers, EMP |
| 29 | **REACT** `Frozen_Struggle` | A stiff pose straining against ice, small jerks | loop | freezes, petrify, stone |
| 30 | **REACT** `Burning_Flail` | Patting at flames, flailing, stumbling | loop | burns, fire, napalm, hellfire |

Bonus, if there is appetite: `Stagger_Back` (a two-step stagger), `Cough_Poisoned`
(doubled over), `Recoil_Exhausted` (drops to the knees after an ultimate —
selfStun / recoil casts), `Weapon_Twirl_Flourish` (a kill confirm) and
`Dropkick_Flying`.

---

## 7. What stays the same (the rules this plan never breaks)

- RULE #1: existing files only; the delivery is one zip; `index.html` bumps
  its token with every R2 file.
- RULE #2: every beat reaches the guest (the rigs relay the spell id), every
  shot passes the screen-true fog gate, and nothing new goes on `state`.
- The strike-frame rule: a clip's `strikeAt` lands on the launch / impact.
  Never a per-site delay.
- `_sigRunOwned` + `_fxDelay` for every new signature
  (sig-refusal-cleanup.test.js).
- The kill-switches stay: `EW_DISABLE_CINE_FX`, `EW_DISABLE_CINE_FAMILIES`,
  `EW_DISABLE_VOID_STAGE`. The new one is `EW_DISABLE_SPELL_DIRECTOR`, which
  restores the old layering exactly.

## 8. Open decisions for the user

1. **The extension (Phase 1b).** Directors fit the rig's window today. A few
   families would gain from +300–600 ms (the summon reveal, the god-shot
   aftermath). Is a slightly slower turn acceptable for heavy / ultimate
   casts only?
2. **The void budget.** One void stage per round, game-wide. Keep it, or
   make it one per side?
3. **The fever intensity.** The Phase 3 screen effects are loud by nature.
   Default ON at 60 %, with the Impact FX slider owning it?
4. **Combo length.** An Entropy Strike runs ~6 s and a finisher ~6.5 s. A
   combo is two units' turns: target ~4.5 s?

## 9. Acceptance per phase

- **P1:** `SpellDirector.resolve` is non-null for 519 / 519 spells. The
  probe shows ONE camera move per beat on a sample of every family. The
  unreachable bespoke sequences (Howl, Trick Room, Chivalry, Wish Granted,
  Reassemble, Eject, Awakening) log `played`. `npm test` is green.
- **P2:** no cast clip plays more than 15 % of spells, and every
  `castMelee` spell has a verb that matches its name.
- **P3:** shared-only spells go from 120 to 0; the fever kinds hold 60 fps on
  the High tier and do not stall the Low tier.
- **P4:** every combo has a director and a world event; the relay replays
  it.
- **P5:** bare capstones go from 44 to 0.
- **P6/P7:** the user's playtest.

## 10. Build log

### 2026-09-23 — the plan + Phase 1 (THE DIRECTOR) · local delivery
**Shipped (battle.js, online.js):**
- **One entry, three rigs.** `_cinePlaySpellSequence` is called by the
  offensive two-beat (as before), the SELF hero shot (`rig: 'self'`, the aura
  pop at 640 ms is the payoff frame) and the SUPPORT gift shot (`rig:
  'support'`, the rig's own clock). Each rig passes its own `timings` /
  `cutMs` / `impactMs`, and `_cineClaimCast` dedupes a cast that touches two
  rigs.
- **Ownership split** (§3). `cineOwnShot` = the stock beats yield AND
  retargets are blocked; it now also clears a lazy claim's retarget
  permission. `_cineClaimShot` = the LAZY claim: the stock beats yield,
  retargets are kept. `_cineDirecting(seq, fn)` is the directing context
  (`_cineAt` beats and a bespoke sequence's synchronous call), and
  `_cineBeatMove` / `_cineHardCut` claim for a directing director.
  `_cineRetargetShot` honours `camera._cineRetargetOkSeq`.
- **The stock beat 2 is a callable.** `camera._cineStockHit = { seq, run }`
  on all three rigs (the offensive reverse cut / pair drift / wide cut, the
  self push-in, the support heal cut / blessing glide). Its timer waits
  `CINE_CLAIM_GRACE_MS` (40) past the cut so a director beat on the same
  frame claims first.
- **Every kind has a family** (five new: `deploy`, `summon`, `control`,
  `transform`, `world`). `SPELL_FAMILY_DIRECTORS` holds whole-shot directors
  on the `_spellDirCtx` kit: `at` (drops a beat past the window),
  `own`, `allowRetargets`, `stockHit`, `payoff` (the row's named shot beats
  the family's), `push`, `left`, `raw` (never scale a duration twice), `vis`,
  `live`. New named shots: `cineLowTile`, `cineOrbit`, `cinePartyFit`
  (+ `CINE_SHOTS.lowTile / orbit / partyFit`).
- **`SPELL_DIRECTOR_ROWS`**: the per-spell tuning table. First rows: 43
  bare capstones get a grade / an insert / a void / a slow-mo each
  (`_spellDirFlavour`), plus one family remap (`raceHitALick` → strike).
- **`window.SpellDirector`**: `resolve(id)`, `catalogue()`, `log` (the
  last 40 casts: spell, director, rig, owned / claimed, the beats that fired;
  `@late` = dropped).
- **RULE #2:** `_spellFocusCamera` returns the RESOLVED `spellId` /
  `spellName` (a bare call recovers them from `_focusCamSpellCtx`), and
  online.js's `spell-focus-cam` relay reads them off the result. The guest's
  self shot had no director before.
- **Kill-switch:** `window.EW_DISABLE_SPELL_DIRECTOR = true` restores the
  pre-director behaviour exactly. `_cineApplyFamilyLegacy` is the old family
  code verbatim, the focus rigs stay undirected, and there is no lazy claim.

**Tooling:** `check-spell-presentation.js` (§11). `playtest_spellcam.js`
defaults to the Stadium Δ (Nuketown was retired) and gains `LEGACY=1` (the
A/B), `CAST_AT=x,y` (a self / ally cast) and a `DIRECTOR` line (the
director log).

**Measured** (the census): 519 spells → 87 bespoke + 432 family, **0 without
a director**. Probe on the real engine (offline, stand-in art, Flat Lands Δ):
- `raceBoo`: bespoke, claimed. The face cam holds the whole pan; with
  `LEGACY=1` the stock reverse cut (tilt 74, yaw −68) overwrites it
  mid-pan. That A/B is the double-cut bug, on film.
- `raceTrickRoom` and `raceHowl`: `rig: 'self'`, bespoke, claimed. **They
  played for the first time** (Howl's low glam drifting 38° → 56°).
- `raceJellyRebirth`: self rig → `family:support` + the ocean void row.
- `raceGlitterburst`: `family:groundAoe`, owned, beats `hit` → `print`.
- `raceFederationBeacon`: support rig → `family:deploy`, the assembly shot.
- `raceKiWave`: bespoke, claimed.

**Tests:** `spell-director.test.js`. It checks the census (none without a
director), the family table ↔ the directors, the rows' fields, the
ownership sources, the three rigs, and the relay. THE HARNESS runs every
family director at two weights on a fake clock with the real block: it owns
the shot, the stock cut never fires, no two hard cuts land within 50 ms, and
no camera beat falls past the window. It also checks the lazy claim and the
kill-switch.

**Not done / notes:**
- The CHARGE rig (`animateDashActionCamera`, dashes and charges) is a
  composed shot of its own and does not consult rows yet.
- The finisher and Entropy Strike pipelines are untouched.
- Bespoke sequences keep their layered design but now claim lazily. Phase 1b
  should re-read the 87 and give each an explicit take (`c.own()` +
  `c.stockHit()`) where it wants the stock beat 2 back.
- The self rig's clock is fixed (the pop at 640 ms).
- **UNSEEN LIVE (RULE #1c)**, the look of every family director with real
  art:
  - the low-tile assembly shot's height against each device;
  - the orbit's 64° swing (`cineOrbit(cs, 64, …)` is the edit);
  - the summon reveal's crane;
  - the control family's dolly zoom strength (−11 FOV);
  - the partyFit's tilt 46.
- **Next:** Phase 2 (THE BODY).

## 11. The census tool

`node check-spell-presentation.js [--json] [--list <bucket>]` (repo tooling)
prints §1's numbers from the live files: the spell count, the kind → family
table, the director each spell resolves to, the cast clip spread, the VFX
identity buckets (signature / bespoke / shared-only / rowless), and the bare
capstones. Re-run it at the end of every phase; its numbers are the
acceptance lines in §9.
