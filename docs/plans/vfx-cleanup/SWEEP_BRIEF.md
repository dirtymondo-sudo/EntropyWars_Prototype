# THE SWEEPS: the generic white left inside each spell (plan batches B6a ... B10)

The shared layers are done (plan section 10: B0-B5). What is left is spell by spell: white clutter that a spell's OWN
effect still draws. One thread a batch.

| Thread | List | Elements | Spells |
|---|---|---|---|
| B6a / B6b | `batches/B6a.txt`, `B6b.txt` | light: divine, aura, heal, mana, lightning | 96 + 95 |
| B7a / B7b | `batches/B7a.txt`, `B7b.txt` | air and cold: ice, water, wind, metal, sonic | 74 + 74 |
| B8a / B8b | `batches/B8a.txt`, `B8b.txt` | fire, earth, nature, poison, blood | 83 + 82 |
| B9a / B9b | `batches/B9a.txt`, `B9b.txt` | mind and dark: arcane, psychic, hex, unholy, anomaly | 109 + 108 |
| B10 | `batches/B10.txt` | bodies and tech: human, kinetic, grapple, skyfall, rig, tech, alien | 112 |

## Read first
`CLAUDE.md` (RULE #1 delivery, #1b token, #1c browser runs, #1d fresh check, #2 online), `docs/notes/owner-rules.md`,
`docs/notes/claims.md` (take a row "VFX sweep, B<n>"), `docs/plans/vfx-cleanup/VFX_CLEANUP_PLAN.md` sections 1, 2 and 10,
your spells' rows in `SPELL_TABLE.md` (the "White layers found" column is the lead for each spell), and
`docs/notes/spells-vfx.md` from "THE VFX CLEANUP, B0 + B1" to the end (B1-B5 and THE OWN LOOKS, L1-L6).

## What mondo said (11-17), word for word where it matters
- "take out all of these generic basic white vfx that crowd the screen and the animations and either replace them or just
  leave them be because the spell might not need it anyway."
- "I am very specifically talking about the white vfx that are spammed on all the spells, not just anything that is
  white." "i didnt want you to literally take out everything white."
- "for area spells i still want every square that is hit to flash ... that is the whole point of the flash to show
  where the damage hits."
- The runes: "a simple healing spell doesnt need a god damn satanic green rune underneath it. that should be preserved for
  magic spells where it makes sense. and it also clashes with the abstact/noise textures that get drawn on damaging tiles."
- "can you not just trace which white vfx are spammed a lot? ... it should just be in the code."

## So, for each spell on your list
1. Find its white in the CODE (its row in the table, then its signature / recipe in three-vfx-effects.js).
2. Decide per piece:
   - **generic clutter** (a white screen flash, a white speed burst, a white ring or disc that any spell could wear, a
     white core on something that has a colour, a rune under a spell that is not rune magic or under a noise wash):
     remove it, or give it the spell's own colour when the piece itself is right.
   - **the thing itself** (snow, a holy light's own shape, a camera flash that IS the spell, steel, bone, a ghost): leave it.
   - **the per-square hit flash**: KEEP it, in the spell's colour. Never strip it.
3. Most spells need little or nothing. "No change" is a fine result: list it.
4. Then shoot the spells you changed and look: is the spell still itself, not empty, the caster / target / hit / number
   clear? Fix or put back what reads worse.

## Never
- THE HIT BLINK (the victim's body flashing white), the damage numbers, the team rims, the tile glow, the hit stop.
- The element passes (fire, ice, water, nature, wind, metal, earth, sonic, blood, psychic): they are each element's base.
  EXCEPT the three leads below, which are yours if they are in your elements.
- The shared helpers and the kits (`_stageBurst`, `_vcPal`, `_vcCol`, `_beamKit3D`, `_portalKit3D`, `_sig*` helpers'
  own bodies): the cleanup thread holds them (claims.md). Change what a spell PASSES to them, not them.
- The own-look blocks ("THE OWN LOOKS, L1" ... "L6"): another thread wrote each spell's piece today. If one of them
  draws generic white, fix that row; do not remove a look.
- A spell, a prop, a model, a rule. Looks only. Nothing on `state`; everything rides `fire()` / the stage beats.

## Leads already found (take the ones in your elements)
- **Metal (B7):** the metal noise sheet on hit squares still reads nearly white (seen on Railgun: `_NZ.metal`, sheets
  `techno_10` / `techno_05`); the metal stamp's glints (`_MTL.glint / rim / hot`).
- **Wind, sonic (B7):** the wind gather + mark (`_wdGather`, `_wdMark`) and the sonic rings are still pale.
- **Lightning (B6):** EMP Burst, EMP Grenade, Yellow Thunder: the L2 looks draw alongside the old white arc webs: busy.
- **The 14 line spells still on the old laser** (it now has a coloured core): Flamethrower, Gale, Crosswind, Piercing
  Arrow, Ball Lightning, Timber!, Black Tendrils, Bone Lance, Bullet Pass, Shockwave Clap, Freeze Breath, Sonic Breaker,
  Chart Topper, Water Pulse. Where the spell draws its own piece down the line, the laser under it should go
  (`_fireBeamMapped`: add the id to a small skip table beside `_vcSB`; say so in your notes); where it would be left
  empty, leave it.
- **Single spells:** Ki Charge's gold ring disc; Love Ray's purple circle under the shooter; Jackpot and Shattered
  Mirror (a glass orb + a wide ring about 0.45 s after the hit, source not found); Watering Can (a big tan ring, source
  not found); Ice Slide (its own ice strip on top of the ice pass).

## How to work
- `git fetch origin main && git merge origin/main`, `node fresh-check.js` first and before every capture run.
- Everything behind the same switch: `_vcOn()` (`window.EW_NO_VFX_CLEANUP = true` = the old look).
- PRs of 15 to 30 spells, merged and uploaded per RULE #1 (PR, merge, `?v=` bump, `node sync-zip.js --upload`). Eight
  other threads edit three-vfx-effects.js: merge main before every PR, keep both sides; in claims.md and spells-vfx.md
  keep every thread's rows and sections.
- `node --check` every JS file you touched. No tests.
- Capture: `bash docs/plans/vfx-cleanup/tools/harness/setup.sh`, then
  `node /tmp/sv/sv-run.js --only <ids> --out /tmp/sv/<name>` (+ `--dense --w 1920 --h 1080` for anything fast or far:
  beams, lines, projectiles) and `python3 /tmp/sv/sv-report.py /tmp/sv/<name>`. Shoot only what you changed, several
  spells a run, and look at the frames yourself. A page that fails to boot once: retry once.
- Notes: a section per PR in `docs/notes/spells-vfx.md` ("THE VFX SWEEP, B<n>, part k"): each spell changed and what
  changed, and one line listing the spells checked that needed nothing.
- Final reply: spells changed / no change / could not judge (and why), frames under `docs/plans/vfx-cleanup/img/sweep/`,
  the `[EW BUILD]` HEAD, uploaded files + sha256[:8]. Say plainly what you did not see.
