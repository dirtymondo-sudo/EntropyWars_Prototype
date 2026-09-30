# Spell family audit — Batch B log (2026-09-30)

SPELL_FAMILY_AUDIT_PLAN.md §9 Batch B, the registry, as one export (`docs/spell-audit/batches/batchB.js` builds
`batchB.json` from `s7.json`, the parsed §7 table). R2 files: data.js, battle.js, ai.js.

## What shipped

- **Families (§6.1):** 8 gone (Acting Chops, Archaeology, Astronaut Camp, Culinary Arts, Music Theory, Persuasion,
  Astrology → Fortune Telling, Stone Age → Giant Abilities). Renamed: Occult Knowledge → Ancient Knowledge, Tentacle
  Appendages → Cephalopod Anatomy, Monkey Brains → Great Ape, Drug Use → Psychedelics, and the Chemistry / Scarecrow
  Abilities typos. UNIQUE (Q9): Scarecrow Abilities (scarecrow), Ki Energy (ki fighter).
- **Race families (§7):** all 124 races carry the plan's list (3–5 each).
- **Rungs (§7):** 73 races' RACE_TREE rows rewritten (`treeB.json`; `rungsB.js` resolves the plan's names, checked
  against the pre-audit tree). Every rung sits inside its race's families.
- **22 MOVEs:** Green Thumb, Tinker and Field Operative leave TRAINING for Agriculture / Engineering / Computer Hacking;
  Gravity Boots, Tail Whip, Ink Cloud, Tithe, Star Crossed, Stone Throw, Thick Hide, Seismic Leap, Divine Judgment,
  Ocean Current, Hydraulic Punch, Blessed Blade, Long Rifle, Bone Barrage, Nuclear Option, Ayahuasca Retreat, Call Out,
  Stick-Up and Borrowed Claw each change family.
- **16 rung rows deleted:** Ambush Lunge, Neural Hack, Blurry Photo, Inner Demon, Clockwork Turret, Pixie Dust,
  Scorched Earth (shared const, by hand), Radiant Bolt, Cliff Charge, Improvise, Ice Shard, Gothic Rampart, Tinker's
  Contraption, and the merges Primal Roar → Apex Roar, Unstoppable Charge → Rampage, Robo Punch → Hydraulic Crush.
- **2 passives:** Chitin Armor (+8 DEF, immune to Stagger) and Symbiote Armor (once per life under 40%: heal 30%).
  Passives never cost MP now (data.js skips them in both cost passes).
- **18 new rung rows (§6.3):** Roll Credits, Disintegrator, Entangling Roots, Bone Lance, Scrap Mine, Car Toss, Rot,
  Long Bomb, Web Swing, Time Rewind (the T3 heal, `raceTimeRewindHeal`), Empty the Clip, Soothe, Brood, Dead Man's
  Hand, Double Down, Petrify, Sprint, Vault.
- **Engine (battle.js / ai.js):** the heal kind reads `healPct` (a share of the target's max HP) and applies its
  `statusEffects` (Soothe's Regen); the AI scores `healPct` heals.

## Known gaps (by design, later batches)

- Animal Handling, Mirror Magic and Internet Addiction are worn but still empty: their rows are Batch C.
- Poison Arrow stays until Batch D: it becomes the Venom Coat upgrade, which needs the new `addStatus` patch key.
  Robin Hood's rung 1 is already Fire Arrow.
- Brood's Drone bites without Poison (`summonDef.hitStatus` is Batch D) and uses the stock summon body.
- Web Swing does not need line of sight (the teleport kind never checks it; the plan's "needs line of sight" is Batch D).
- Pools are below §7's "after" counts until Batch C adds its 99 rows and 23 passives.
