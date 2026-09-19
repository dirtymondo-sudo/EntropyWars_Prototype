# LIVE_ACTION_PLAN.md — LIVE COMBAT IN THE AREAS (the Skyrim hands)

Status: PLAN (2026-09-19). Nothing built. The user's brief, verbatim in spirit:
dual-wield the seven equipped spells — LEFT CLICK fires the left hand, RIGHT
CLICK the right; a ROLL to dodge; MIDDLE CLICK opens a weapon wheel that binds a
spell to a hand; a HEALTH BAR on the HUD; the spell VFX stay; ranges become a
reach in the 3D world. This doc answers "what else has to exist" and stages it.

Read first: CLAUDE.md "THE ENCOUNTER", "THE PARTY", "THE DOOR GUN rev 3–5",
"SKATEBOARDING" (the walker-mode pattern), PARTY_BUILDER_PLAN §2 (the forge stage
borrows the battle's VFX layer — the ONE precedent for spell VFX outside a match).

## 0. The one-line answer

The turn engine's spells are ROWS (`RACE_ABILITIES` / `SPELL_LIBRARY`: kind, dmg,
spellType, range, aoeRadius, lineWidth, cost, cooldownRounds, statusEffects…)
resolved by ONE function, battle.js `doSpell`, against `state.units` standing on
tiles, with the camera, the VFX and the HUD hanging off it. The walker in an
area has NO `state`. So live combat is not a conversion of `doSpell` — it is a
SECOND, SMALL RESOLVER (THE LIVE ENGINE) that reads the SAME ROWS and applies
them to real-time ACTORS (the officer + the room's natives), reusing only the
PURE math (`computeSpellBase` / `calcFlatSpellDamage`, `getTypeDamageMultiplier`,
the `STATUS_DEFS` fields) and the VFX recipes (`VFX3D.fire` through the stage
route). Everything turn-shaped (AP, initiative, two-click picks, possession,
turn-order tricks) has no live meaning and is left out by rule.

## 1. What already exists and carries this (do not rebuild)

| need | it is already |
|---|---|
| move / look / jump / pointer lock | the walker (`_hqTickWalker`, `H.onMouseDown` routing, `_hqTryLock`) |
| an aim ray against the room | THE DOOR GUN's march `_hqPortalAim` (floor / wall / ceiling hit, 160 m; `_hqPortalSolidAt`, `_hqPortalWallHit`) — the crosshair's hit point IS this |
| a target under the aim + line of sight | `_hqEncounterAim` (cone, reach, `_hqLosClear`), `hqEncounterCharOk` |
| a cast / attack clip with a strike frame | `_hqStrikeClip(pl, gesture)` → `_castChainFor(kind)` / `_attackChainFor(kind)`, `_slotStrikeMs` (THE STRIKE FRAME) |
| the enemies as bodies | `H.chars` (rigged natives, `x / z / y / yaw`, an `entry` with actions), spawned by `_hqSpawnPopulation` with a `race` |
| the player's HP / MP | THE PARTY's officer member (`hqPartyRecord().members[0]`, `hqPartyVitals`) — carried between fights already |
| the seven spells | the officer's build (`customSpells`, `SPELL_SLOT_MAX` 7) via THE LAST ROSTER / the party member's `meta` |
| the spell rows + their meta | `getSpellById`, `SPELL_KIND_META` (offensive / allyOnly / selfCast / directional / tileTargeted) |
| the damage / type math (pure) | `computeSpellBase`, `calcFlatSpellDamage`, `getTypeDamageMultiplier`, `classifySpellElement` |
| the VFX outside a battle | `ThreeVFX.attach(group)` + `VFX3D.stage.enter / fire / caster / exit` (three-vfx-effects.js `_VS`) |
| a HUD material | THE HQ HUD PASS (`#hqStrip`, `#hqPrompt`, `#hqToast`, `#hqTrick`, the `--ew-*` tokens) |
| a dodge-shaped movement | the skate bail / the walker's `mvx / mvz` carry (`_hqTickCarry`) — a roll is the same impulse with i-frames |
| the fight's commit | `hqPartyAfterMatch`, `hqEncounterRecord`, the cleared-room rule, the ward |

## 2. What has to be added (the real list)

### 2.1 THE LIVE ENGINE (data.js + three-renderer.js, a walker mode like the ride)
- `_hq.live = { on, actors: { id → { hp, hpMax, mp, mpMax, statuses, team, shield, downAt } }, hands: { l: slotIdx, r: slotIdx }, casts: { l, r }, cooldowns: { spellId → untilMs }, roll, lock }`.
  An ACTOR is the walker or a native; its stats come from `createUnit`'s numbers
  for the race / job (the party member's own for the officer, a fresh build for a
  native) — never a unit OBJECT on `state`; ids only (RULE #2's habit).
- `hqLiveSpell(row)` (data.js, pure) → THE LIVE SHAPE: `{ delivery, reachM, radiusM,
  widthM, castMs, cooldownMs, mp, self, ally, dmg, type, statuses }`. **THE TILE
  IS 1.75 m** (`HQ_CAVE_CELL`) — the same rule every room already uses:
  `reachM = range × 1.75`, `radiusM = (aoeRadius + 0.5) × 1.75`, `widthM =
  (lineWidth || 1) × 1.75`, `cooldownMs = cooldownRounds × HQ_LIVE_RULES.roundMs`
  (2 500), `castMs` = the clip's strike frame. `HQ_LIVE_RULES` is the table
  (mpRegenPerS, roundMs, rollMs, rollIFrames, rollM, hitstopMs, meleeReachM…).
- `hqLiveResolve(engine, casterId, shape, hit)` (pure over the actors map): the
  damage roll (`computeSpellBase` + the type wheel), the status apply (a live
  status is `{ id, untilMs, tick }` — `dot` / `stat stages` / `blockMove` /
  `blockSpells` from `STATUS_DEFS` fields; the rest ignored), the heal / shield /
  cleanse, KO at 0 (`down`), MP spent at the cast, the cooldown stamped.
- `_hqTickLive(dt)`: the two hands' cast timers, MP regen, status ticks, the
  projectiles in flight (`_hq.live.shots`), the roll, the target lock, the
  natives' AI (§2.6), the death / commit.

### 2.2 THE DELIVERIES (the "ranges become a radius" answer — one per kind class)
| class | kinds | live delivery |
|---|---|---|
| hitscan | damage / debuff / lifeDrain / multiHit / possess-less single-target with a bolt VFX | the aim ray to `reachM`; the first actor within `hitR` (0.6 m) of the ray, else the wall; damage at the strike frame; the VFX's bolt flies for show |
| projectile | anything with `projectileClass` / arrows / thrown / boulders / ricochet | a body launched from the hand at `projSpeed` along the aim, life = `reachM / speed`, a sphere test per frame — **dodgeable** (this is what the roll is for) |
| beam | line / linePush / splitBeam | a box `reachM` long, `widthM` wide, from the hand along the aim; every actor inside hit once (linePush shoves along the beam) |
| ground target | aoe / aoePull / cross / delayed / barrage / summonWeather / zoneDebuff / zoneHeal / skyDrop / skyThrow | the crosshair's hit point on the FLOOR (the door gun's floor hit) within `reachM` → a sphere `radiusM`; `delayed` keeps its telegraph then falls (the descent VFX already does this by itself) |
| self | selfHeal / healAll / warCry / shield / buff (selfCast) / escape / transform / scan | the caster; `healAll` / `warCry` = every ally in `radiusM` (the party's followers, §2.7) |
| ally target | heal / shield / buff / revive / cleanse | the ally under the crosshair, else SELF (Skyrim's rule: an ally spell with nobody aimed heals you) |
| melee | tackle / leapStrike / dash-with-hit / the basic attack | `meleeReachM` 2.2 in the cone (the strike as it stands, `_hqEncounterAim`), the hit at the strike frame; `dash` / `leapStrike` MOVE the body to the aim point first (the carry impulse) |
| mobility | teleport / dash / swap-less escape | blink / slide to the crosshair's floor point (≤ `reachM`); the VFX fires as is |
| deploy | deployTurret / summonUnit / deployObject / deployPair / door | STAGE 4: a placed thing on the floor point that shoots / walks on its own tick; Knock Knock = the door gun's pair (already a live object) |
| terrain | terrainCreate / monument rows | STAGE 4: place the monument GLB on the floor point as a BLOCKER (the walker's own rule) — a real wall you hide behind; `terrainDeform` never (no field to dig in a room) |
| no live meaning | trickRoom / encore / quickdraw riders / possess / link / transfer / swap / cannibalize / raiseDead / steal / tuneFrequency / apCost riders / AP refunds | REFUSED on the wheel with a note ("TACTICAL ONLY") — the row stays equipped for the Δ battle |

A row's `spellType` keeps the type wheel; `ignoresLineOfSight` = the ray passes
walls; `healTakenMult` / `magicDamageTakenMult` / `damageType` phys vs magic are
read as they are. Range 0 rows (touch) = melee reach. `minRange` is ignored.

### 2.3 THE HANDS + THE WHEEL
- `H.live.hands = { l, r }` = a slot index each (0–6 + 7 = the basic attack).
  LEFT CLICK casts the left hand's spell, RIGHT the right's; each hand has its
  own cast timer (`casts.l / .r`), a hand busy ignores its button; **both hands on
  the same spell = Skyrim's dual cast** (one shot, ×1.5 damage, ×2 MP, both timers).
  The clip: a one-hand cast plays the cast chain; a dual cast plays `castUltimate`.
  The mouse routing in `H.onMouseDown` grows a `live` branch BEFORE the door-gun
  branch: live + holstered + locked → the hands. Drawn, the door gun still owns
  both buttons (F to holster is the switch — one gesture, no new key).
- THE WHEEL: MIDDLE CLICK (`e.button === 1`) opens `#hqWheel` (map.js, a DOM
  radial over the canvas: eight wedges — the seven slots + the fist — each with
  the spell's icon, name, MP, cooldown ring, a TACTICAL ONLY grey), time slows to
  `HQ_LIVE_RULES.wheelSlow` 0.15 (the walker + the natives tick on the slowed dt),
  the pointer is released; hover a wedge, **LEFT CLICK binds it to the left hand,
  RIGHT CLICK to the right** (Skyrim's favourites); MIDDLE again / ESC / a bind
  closes it and re-locks. The number keys 1–7 bind the RIGHT hand directly
  (SHIFT+n the left) for keyboard players. The binding is saved on the party
  member (`hands: { l, r }` beside `customSpells` — local, viewer-only).
- THE RESOURCE: MP only (no AP); regen `mpRegenPerS` (the officer's INT-scaled);
  a cast with no MP fizzles with the buzz; cooldowns per spell.

### 2.4 THE ROLL
- A walker mode (`_hqTickRoll`): a KEY (recommend LEFT CTRL — C is the dive, V and
  B are taken; the pinned `q || p` tail in `_hqKeyName` holds) + a direction (the
  held WASD, else backward) → `rollM` 3.6 over `rollMs` 550 on the carry impulse,
  i-frames for `rollIFrames` 0.6 of it (a projectile / a beam / a melee swing
  that would hit during them is a MISS, the float says DODGED), stamina-free but
  `rollCooldownMs` 300; the body squats (`scale.y` 0.8 → 1) and the clip is the
  library's roll if one exists (check `node anim-sheets.js` for `Roll_Fwd` /
  `Dive_Fwd`; else `Slide_Start` at 1.6× = the skate bail's run-in). Never while
  swimming / climbing / riding / at the helm.
- A hit taken shoves the body along the hit's direction (the car-knock's impulse)
  and plays `hit` (the `_hitAnimFor` chain); a KO plays the bail's fall.

### 2.5 THE HUD (map.js, index.html, styles-base.css "THE LIVE HUD" after THE HQ HUD PASS)
- `#hqVitals` bottom-left: HP (green, shield in pale blue over it) + MP (blue)
  capsules in the Horologe material off the officer actor, numbers on hover;
  the two HAND SLOTS either side of a crosshair (`#hqHands`: icon, name, cooldown
  wipe, the MP cost red when short), the crosshair turns red on a hostile under
  the ray, green on an ally.
- An ENEMY PLATE over the aimed / last-hit native (a CSS2D floating label like
  the door plates: name, race, a health capsule; it fades 4 s after the last hit).
- Damage floats (DOM, `#hqFloats`, the battle's colours: white / gold crit /
  green heal / red WEAK / grey RESIST) at the actor's projected head; hit-stop
  `hitstopMs` 60 on a hit that lands (the frame's dt zeroed); a screen flash on a
  hit taken (`.hq-hurt` vignette); the CRT's `data-grade` kick from the forge.
- The strip pill LIVE while a fight is on (`_hqStripFlash`'s rule: shown while live).

### 2.6 THE ENEMY (data.js `hqLiveAi`, pure; the tick moves the body)
- A native with a `race` that `hqEncounterCharOk` accepts becomes HOSTILE when
  struck / cast at / aggroed within `aggroM` 9 with LOS; it has the race tree's
  ring-1 + ring-2 spells (four, the AI weights' favourites), a basic attack, and
  a state machine: idle → approach (to its best spell's reach, strafing) →
  cast (its own cast timer + a telegraph 0.5 s the player can roll) → retreat
  when low (the ranged kinds keep `reachM × 0.6`); a downed native stays down
  (the cleared-room rule — no respawns, the user's party rule); the others in
  the room join when they SEE the fight (`_hqLosClear`).
- Natives use `_hqSurface` / the blockers for pathing — the walker's own step
  rule stepped toward the target (no navmesh in stage 1; a native stuck 1.5 s
  strafes).

### 2.7 THE PARTY IN THE FIGHT (stage 3)
- The FIRST SHIFT follows the officer (a follower AI = the enemy AI with the
  team flipped; the bench stays home); their HP / MP are the party record's and
  the commit is `hqPartyAfterMatch` with the same `{ partyId, hp, mp, dead }`
  rows; the WAKE rule (the ward / Room 101) and the toast stand.
- The fight's END: every hostile in the room down → CLEARED (the envelope
  opens, `hqEncounterRecord` with `won: true`, the same tape / pay rules); the
  officer down with nobody fit → EXITED → the ward.

### 2.8 THE VFX IN A ROOM (the one engineering risk)
- The recipes take TILE coordinates about a board origin and read the ground
  through the stage's flat `_LT()` / `_geom3D` shims. THE LIVE STAGE:
  `VFX3D.stage.enter({ tile: 1.75 × U, ground: (x, y) → _hqSurface })` — the
  stage grows a `ground` callback (three-vfx-effects.js `_VS.ground`, read by
  `_LT()` / the impact-height sites; flat when absent) and every live cast fires
  `stage.caster(px / 1.75, pz / 1.75)` then `stage.fire(intent, spellId, { x: tx /
  1.75, y: tz / 1.75, … })`. `ThreeVFX.attach(_hq.root)` on entering live,
  `detach()` on leaving (the pools go home to the battle). The camera / post
  shims (`_VS.post`) route to nothing in a room (no CineFX in a walker mode).
- What will look wrong until touched: tile-snapped impact centres (the burst
  lands on the cell centre, not the hit point — pass fractional tiles, most
  recipes accept them), effects that read `state.units` for victims (the chain
  lightning, the multi-target sweeps — they need the actor list handed in),
  descents timed to a telegraph in ROUNDS.

### 2.9 What is left out on purpose
Online (the areas are viewer-local, VS-CPU — RULE #2 has nothing to relay;
`isOnlineMatch` refuses live like it refuses the encounter). Levels / XP (the
party's rule). The Δ battle: THE MARKER still files a crossing; the strike click
goes LIVE when `ew_hq_combat === 'live'` (Settings → Gameplay: TACTICAL /
LIVE; default tactical until the prototype holds) — both modes coexist, the
room does not decide.

## 3. The stages (each a delivery; each `npm run test:quick` + `hq-live.test.js`)
1. **THE CORE** — the engine record, `hqLiveSpell` for the hitscan / projectile /
   beam / ground / self / melee classes, ONE hand (left = slot 0, right = the
   fist), the roll, the HUD vitals + crosshair + enemy plate + floats, natives
   that take damage and die, the stage VFX route, the Settings toggle. The
   officer alone. `node playtest_live_offline.js <room>` (the HQ probe's mirror).
2. **THE HANDS** — the wheel, both hands, dual cast, cooldowns, MP regen, the
   keyboard binds, the binding saved.
3. **THE FIGHT** — the enemy AI (approach / cast / telegraph / retreat / join),
   aggro, the followers, the commit + the cleared room + the wake.
4. **THE LONG TAIL** — mobility kinds, deploys, the monuments as cover, the
   ally targets, the status ticks in full, the chain / sweep VFX fed the actors.
5. **THE FEEL** — hit-stop, camera kicks, a lock-on (Q holds the target while
   holstered), the audio (a cast whoosh / a hit thud per type), the boss natives.

## 4. Decisions the user owns before stage 1
- D1 The roll key (LEFT CTRL proposed) and whether SPACE doubles as the roll
  when a direction is held.
- D2 The wheel's bind gesture: hover + LEFT / RIGHT click (proposed), or a drag
  into a hand.
- D3 Does live combat REPLACE the strike-into-Δ encounter or sit beside it
  (proposed: a Settings toggle, tactical default).
- D4 Followers in stage 3 or the officer alone (Skyrim is alone; the party's
  rule says the first shift is sent out first).
- D5 Which rows count as TACTICAL ONLY (the §2.2 last row is the proposal).
- D6 The numbers: 1.75 m per tile of range, ×2.5 s per cooldown round, 0.6
  i-frame share, MP regen.

## 5. Log
- 2026-09-19 — the plan written from the brief; nothing built.
