# Element reactions: proposals (2026-11-07)

PROPOSAL ONLY. Nothing here is built. mondo picks; each pick then gets its own fix thread.

Read from main `c48a878`: battle.js `triggerTerrainSpellReaction` (the terrain reactions), the combo layer in
`applyDamageToUnit` (`calcElementComboMult` + the post-hit half), `_checkFrozenThaws`, `tickBurningTiles`,
`_fanFlamesAlongPush`, state.js `WEATHER_REGISTRY` + `stormStrikeUnit`, data.js `STATUS_DEFS`, `TERRAIN_RULES`,
`ELEMENT_TERRAINS`, plus the 11-06 elements playtest and the 11-07 status effects playtest.

Every proposal uses only things already in the game: the 62 statuses, the existing terrains (water, ice, stone,
scorched, grass, blood, lava, ooze/oil, poison bog, crystal), the 3-round terrain timer, the existing reaction
functions (conduction, flash-freeze, ice shatter, oil blast, crystal shatter, fanned flames, douse). No new statuses,
terrains or names.

---

## 1. What is already in the game

### Element x status (the combo layer, on the unit)

| Element hit | Wet | Burning | Frozen | Other |
|---|---|---|---|---|
| Lightning | ×1.5 (×1.5 SHORT CIRCUIT on tech) | | | Dry tech: ×0.5 + Overclock + 25 MP |
| Fire | ×0.75 and dries the Wet off; can't set Burn on a Wet unit | | thaws it | |
| Ice | Frozen 1 round | douses the Burn, leaves the unit Wet | | |
| Water | leaves Wet (every water hit) | douses the Burn | | |
| Poison, earth, wind, nature, sonic, psychic, blood, metal | nothing | nothing | nothing | nothing |

### Element x terrain (the terrain reactions, on the squares)

| Element | Water | Ice | Ooze / oil | Forest / grass | Burning ground | Lava | Metal floor | Crystal |
|---|---|---|---|---|---|---|---|---|
| Lightning | conducts through the pool + Wet bodies | | blows up the slick | sets it on fire | | | conducts | shatters the vein |
| Fire | | melts to water | blows up the slick | sets it on fire | | | | shatters the vein |
| Ice | flash-freezes the pool, Frozen on units in it | | | | puts it out, leaves water | stone | | |
| Water | | | | | puts it out | stone | | |
| Physical slams / hard landings | | cracks to water | | | | | | |
| Poison, earth, wind, nature, sonic, psychic, blood, metal | nothing | nothing | nothing | nothing | nothing | nothing | nothing | nothing |

Ground fire on ooze / oil also blows up the slick (PR #972). Lava melts ice next to it and thaws Frozen units next to it.
A shove through fire fans it 1 square downwind and sets the shoved unit on fire (Fanned Flames).

### Weather x status / terrain

| Weather | What it does to statuses | What it does to squares |
|---|---|---|
| Thunderstorm (wet) | Wet on everyone; the eye's bolt ×1.5 on the Wet | puddles; puts out ground fire when it forms; lava → stone |
| Hurricane (wet) | Wet on whoever it catches; douses Burn | floods water; same fire / lava rules |
| Blood Rain (wet) | Wet on everyone | blood pools |
| Blizzard (wet) | Blind; the eye's hit flash-freezes the Wet (cold combo); hits Frozen twice as hard | ice trail |
| Drought (dry) | thaws Frozen; healing ×0.5 | dries the fight's water, blood and ice; desert |
| Sandstorm (dry) | | desert |
| Solar Flare | hurts tech, +ATK divine | scorched |
| Earthquake | | rocky ground |
| Tornado, Tesseract Storm | | nothing |

Dry and wet skies drive each other off (PR #970).

### The gaps this shows

1. (Corrected 11-07 05:30; the first wording "never touch the board" was wrong.) The board already has poison and blood
   ground: Poison Bog / Plague Flesh / Black Ooze (ticks, Poison, Gooed), poison spells that paint ooze and bog, Blood
   Rain's Blood Pool, and every element's ×1.25 home ground. What is missing: when a poison, earth, wind, nature, sonic,
   psychic, blood or metal spell HITS a square, nothing reacts. The dispatcher (`triggerTerrainSpellReaction`) only
   answers fire, lightning, ice and water, so e.g. a blood spell on a Blood Pool or a poison spell on a bog sets nothing
   off.
2. The status pairs stop at Wet / Burn / Frozen. Poison, Gooed, Bleeding, Rooted and Overclock have obvious partners
   (fire, water) that never meet them.
3. The weathers are half-joined: Drought dries the squares but not a Wet unit; Solar Flare is heat but never thaws or
   melts; the Thunderstorm's bolt never conducts; the Earthquake never cracks ice, though a slam does.

---

## 2. The proposals (17, grouped)

Each one: **Trigger** / **Effect** / **Why it fits** / **Balance risk**. A ⚠ line means it touches an existing rule.

### A. Heat and drying (finishing what Drought and fire already do)

**R1. Dry weather dries Wet units.**
- Trigger: Drought or Sandstorm is up (or forms) while a unit is Wet.
- Effect: the Wet comes off at the round tick (Drought: everyone; Sandstorm: whoever its eye catches). Standing in water
  still re-wets.
- Why: Drought already dries every water square and thaws Frozen, and dry skies already drive the wet skies off. A Wet
  unit staying wet under a drought is the odd one out. This one reads close to a bug.
- Risk: low. Takes the lightning ×1.5 setup away under a drought, which is the point of a dry sky.

**R2. Solar Flare is heat.**
- Trigger: a unit or square inside the Solar Flare.
- Effect: thaws Frozen units, melts ice squares to water, dries Wet units (the same three things Drought and lava do).
- Why: it already scorches the ground; heat that scorches but leaves ice standing contradicts the lava and Drought rules.
- Risk: low. Solar Flare is local, so it is a small zone of "no ice".

**R3. Drought feeds ground fire.**
- Trigger: ground fire burning while Drought is up.
- Effect: the spread chance goes up (0.45 → 0.65) and fresh fires burn 3 rounds instead of 2.
- Why: the mirror of rain putting fire out. Wet sky = fire dies, dry sky = fire spreads.
- Risk: medium. Grass maps under a drought can burn fast. The fire cap (`BURNING_TILE_CAP`) still holds.

### B. Combustion (fire meets the other statuses)

**R4. Burn + Poison = Corroded.**
- Trigger: a unit carries Burn and Poison at the same time (either order).
- Effect: both come off and the unit is Corroded for the longer of the two remaining durations.
- Why: Corroded's own text is "chemical fire, counts as BOTH Burn and Poison". The status exists for this exact pair;
  only one spell applies it today.
- Risk: medium. Corroded ticks 44 with DEF ignored, against 24 + 32 = 56 for the pair, so raw damage drops a little but
  armour stops mattering. ⚠ Needs one ruling: does water put out Corroded? It counts as Burn, so the consistent answer
  is yes (it goes back to plain Poison).

**R5. Gooed bodies catch fire.**
- Trigger: a fire or lightning hit on a Gooed unit, or a slick blowing up next to a Gooed unit.
- Effect: the Goo comes off and the unit Burns for 2 rounds. A Gooed unit touching a slick that goes up is caught in the
  blast, the same way a Wet unit touching a pool is caught in the conduction (WET CONDUCTS).
- Why: Gooed is the Black Ooze on a body, and Black Ooze already blows up with fire and lightning. Same mirror as
  Wet bodies counting as water.
- Risk: medium. Black Goo's team becomes fire-weak, and an enemy fire spell after a Goo Shot is a strong two-step.

**R6. Fire cauterises Bleeding.**
- Trigger: a fire hit on a Bleeding unit.
- Effect: the Bleeding stops.
- Why: the same double edge as fire thawing a Frozen ally: the hit hurts, but it closes the wound. A player can burn
  their own bleeding unit on purpose.
- Risk: low. Blood teams (5 blood spells apply Bleeding) lose their tick against fire users.

**R7. Fire on poison bog is chemical fire.**
- Trigger: a fire spell (or ground fire) on a Poison Bog / Purple Bog square.
- Effect: every grounded unit standing in the connected bog is Corroded for 2 rounds. The bog stays.
- Why: R4 on the ground. Ooze already blows up; the bog is the poison liquid, and the poison + fire result is Corroded.
- Risk: medium. Only on bog maps. Overlaps R4, so pick both or neither.

### C. Water washes

**R8. Water washes Goo off.**
- Trigger: the same paths that put out Burn today: a water hit, walking into or standing in water, rain on the unit.
- Effect: Gooed comes off.
- Why: WATER PUTS OUT FIRE uses those paths; goo is a coating, and a coating washes off the same way.
- Risk: low to medium. Weakens Black Goo in rain and on river maps.

**R9. Water shorts out Overclock.**
- Trigger: a water hit on an Overclocked unit, or a unit becoming Wet while Overclocked.
- Effect: the Overclock ends.
- Why: lightning on a dry machine overclocks it, lightning on a wet machine shorts it (SHORT CIRCUIT). Water ending the
  overclock is the same rule seen from the other side, and water is already the machines' weakness.
- Risk: low.

### D. Conduction

**R10. The Thunderstorm's bolt conducts.**
- Trigger: the storm eye strikes a unit standing in water, on metal floor, or touching other Wet units.
- Effect: the strike arcs through the connected water / metal / Wet bodies like a lightning spell (the same conduction
  tick, the same log line).
- Why: lightning is lightning. The storm's own bolt is the only lightning in the game that never conducts.
- Risk: high. The storm also makes everyone Wet, so a clump of units would all take the arc every round. Safer version:
  arc through water and metal squares only, not through Wet bodies.

### E. Cold and shattering (ice reacts to more than fire and slams)

**R11. Sonic shatters ice and crystal.**
- Trigger: a sonic spell hitting ice squares, a crystal vein or a Frozen unit.
- Effect: ice squares crack to water (the slam rule); a crystal vein shatters (the fire / lightning rule, same 55 shard
  hit); a Frozen unit's ice breaks: the Frozen ends and the hit lands ×1.5 (the existing "THAW!" pay-off that
  bonus-vs-Frozen spells already use).
- Why: slams already crack ice and fire / lightning already shatter crystal. Sound breaking glass and ice is the
  plainest case for sonic, which has no board reaction today.
- Risk: medium. Gives sonic a strong answer to Ice Queen / Yeti teams.

**R12. The Earthquake cracks ice and crystal.**
- Trigger: the Earthquake forms over ice squares or a crystal vein.
- Effect: ice → water, crystal → rubble with the shard hit.
- Why: ICE SHATTER already says a slam and a hard landing crack ice. An earthquake is the biggest slam there is.
- Risk: low.

### F. Earth, nature, wind (giving the silent elements a board reaction)

**R13. Earth smothers fire and plugs lava.**
- Trigger: an earth spell hitting burning ground or lava.
- Effect: the fire goes out (the square stays what it was); lava → stone (the same result water gives).
- Why: dirt on a fire is the oldest way to put one out, and stone is already the game's "lava stopped" ground.
- Risk: low. Earth gets a utility use on fire and lava maps.

**R14. Nature regrows scorched ground.**
- Trigger: a nature spell hitting scorched ground or desert left by the fight (never the map's own desert).
- Effect: the square goes back to grass (3-round timer like every change).
- Why: fire turns grass to scorched; nature is the reverse, and grass is nature's home ground (×1.25), so a nature
  caster can build its own footing. It is fuel again, so fire can come back.
- Risk: low.

**R15. Wind fans ground fire.**
- Trigger: a wind spell hitting burning squares.
- Effect: each burning square it hits lights the next square away from the caster (Fanned Flames, which today only
  fires when a unit is shoved through the fire).
- Why: the same rule already exists for shoves; the wind spell itself should do it too.
- Risk: medium. Wind + fire teams can push a fire line onto the enemy. The fire cap still holds.

### G. Blood and steam (optional, each one leans on a past default)

**R16. Bleeding units drip blood.**
- Trigger: a grounded Bleeding unit at the round tick.
- Effect: its square becomes a Blood Pool (3-round timer). Blood spells hit ×1.25 on it (the existing home-ground bonus).
- Why: gives blood a way onto the board besides Blood Rain, and rain already washes it back to water.
- Risk: medium. ⚠ Goes against the 10-21 default "only Blood Rain makes blood" (a thread's call you never answered,
  not your rule).

**R17. Fire on water makes steam.**
- Trigger: a fire spell hitting units standing in water.
- Effect: those units are Blinded for 1 round (no extra damage; the ×0.75 Wet rule still applies).
- Why: gives fire something on water maps, where it is weakest. Uses the existing Blind.
- Risk: medium. ⚠ It is a brand-new effect rather than an existing pair joined up; the weakest fit of the 17.

---

## 3. Considered and dropped (they break a rule)

- **Water spreads burning oil** (real grease-fire chemistry): breaks WATER PUTS OUT FIRE EVERYWHERE.
- **Blood conducts lightning / freezes to ice:** the Blood Pool was built to not soak, conduct or freeze. Only if you
  want blood to act like water.
- **Sandstorm blinds:** your rule says sandstorm is NOT blind.
- **Anything that makes Frozen a Stun:** Frozen is Frozen.
- **Light / dark reactions:** light, shadow and arcane stopped being elements on 10-18, so nothing reacts to them.
  Solar Flare (R2) is the only "light" piece left.
- **Metal and psychic:** no plain physical pair. Metal's story is the metal floor conducting lightning; psychic's home
  is crystal. Nothing proposed.

## 4. Notes for whoever builds a pick

- All of these are host-side engine work. The terrain rides the state-sync; new floating text and log lines go through
  the same paths as the existing reactions so the online guest sees them (RULE #2).
- Every new status landing goes through `applyStatusPayload`, so the dead / falling gate from PR #971 covers it.
- Forecast and AI mirrors: R4, R5, R6, R9 and R11 change damage or statuses the forecast and `ai.js` estDamage read,
  so they need mirroring like the Wet ×1.5.
- The Wet / Frozen / Burn coach steps in TUTORIAL_MECHANICS need a re-read if R1, R2 or R8 change a rule they teach.
