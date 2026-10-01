# THE SPELL AUDIT — Batch D log (2026-10-01)

Plan: SPELL_FAMILY_AUDIT_PLAN.md §9 Batch D ("engine") — every item Batches A, B and C carried over (BATCH_A_LOG.md
"Left for Batch D", BATCH_B_LOG.md "Known gaps", BATCH_C_LOG.md "Rows waiting for Batch D") plus the §6.4 passives and
upgrades that needed new keys, and the §6.5 engine list. Built in four parts; one line per item in `batchD/`:

- `batchD/rows-1.md` — the 32 Batch A rows (zone ticks, area drain, mpDrain, decoys, dash paths, conditional stages …)
  and the new Hall of Mirrors row.
- `batchD/rows-2.md` — the 11 rows Batch C held (Bumper Crop, Shut Door, Twin Doors, Land on Your Feet, Shatter the
  Lattice, Rescue Line, Round Up, Tag In, Swipe, Deathtrap, Snow Fort), the 4 partials (Annihilation, System Crash,
  Miasma, Updraft), Brood's poison bite, Web Swing's line of sight, Grapple, Steal from the Rich, and the seed / weather text.
- `batchD/passives.md` — the 15 NEW family passives, the missing half of the 8 PARTIAL ones, and Resonant Voice,
  Bloodlust and Jellyfish's passive (named Jelly Drift: "Deep Breath" is the Meditation spell's name).
- `batchD/upgrades.md` — 31 new upgrade rows (the `addStatus` eight, Frostbite's thaw half, Reinforced, Sanctified
  Ground, Armor-Piercing, Steady Rest, Loaded Dice, Barbed Rope, Undertow Charge, Tripwire, Tempered Glass, the five
  F.g3 one-row `set` upgrades, Restless, Nightfeeder, Conductive, Reprise, Hush, Tidewater, Daisy Chain, Detonate,
  Overdrive), the §6.5 fit / excl extras, and the new `upgradesBlock` row field applied from the family blocks' "Upgrades"
  lines (85 rows + Living Stone family-wide; the exclusions only — the positive picks are already AUTO).

R2 files: battle.js, data.js, ai.js, online.js, state.js, ui.js, sprites.js, three-renderer.js.

## Totals after D

SPELL_BY_ID 696 ids · 44 family passives · 92 passive hook keys · 49 upgrade rows. Poison Arrow is gone (Venom Coat
replaces it). Re-dump in `data-after/` (the plan's own evidence stays in `data/`): tier-rule offenders 0, every MP on the
25/50/75/100 ladder, no spell in two families, no family on no race. 11 families still miss a tier (each a family
block's choice; the plan expected 12). Race pools 12 – 32: demon princess (32) sits above the plan's 28 ceiling once the new rows and passives count
(ringmaster and cosmic wraith are at 28) — §10 Q6 territory, left for mondo.
SPELL_CATALOGUE.md is regenerated from the library.

## Engine fixes found on the way (not in the plan)

- lifeDrain spells never applied their statuses (Lifetap, Frenzy, Kiss of Decay, Ghoulish Bite); multiHit, ricochet and
  aoeShield rows now apply theirs; Ooze Trail's Slow lands.
- On-kill riders never fired: a dying unit is `_dying`, not `dead`, for ~800 ms (Jurassic Jaw's feed and AP refund work now).
- A sprung status trap used the base row's statuses instead of the caster's upgraded copy.
- Spells can crit (`critChance` on a row, rolled from the seeded stream) — Loaded Dice; Foresight wards spell crits too.

## Review pass after the merge (one reviewer over the whole diff)

Fixed: Swipe moved stat stages without clearing the victim's ledger (both kept them); Annihilation left raised stages;
Swipe could carry off forms (wolf / stone / car / mecha / monster …) — those stay now; a human could not click their own
Shut Door to toggle it (its tiles now light); ai.js's decoy and taunt reads were missing from window.GAME; a decoy broken
by a single-target spell, a line or a terrain cast skipped its Fear; zone ticks took range falloff and flank / ambush
riders; a step-trap transit fired on dash / leap landings; Rescue Line could not haul a Windborne ally and could Stagger
it through Event Horizon; Pathfinder's ×1.3 also hit the landing target; a no-damage pull skipped Event Horizon. Two
Updraft / Swarm Signal implementations of `timedStatBonus` were merged into one (the Quickened status). Bottomless now
also delays the eaten unit's respawn 3 rounds (S1's `corpseDelay`).

## Known gaps (small; none blocks a row)

- Stuffed Double's taunt binds basic attacks only (spells cannot target objects) and the straw has no lifetime (no
  object-lifetime system); Siege Mode's +2 RNG reaches basic attacks, not spells.
- Horn Toss's two-click pick is wired on the board; the HUD action-card cast path was not checked.
- The grapple's aim preview (ui.js) still draws the old landing line; Deathtrap's 3×3 anchors at the clicked tile's
  north-west corner like the 2×2 trapdoor.
- `seedBonus` (§6.5) has no row that needs it; Concussive's "one per kit" has no per-kit rule; the CPU never casts
  Detonate; Iron Discipline's DEF aura is not on the HUD DEF number; the AI does not score regen / aura / anchor keys.
- Per-row positive "Upgrades" picks stay AUTO (an explicit list would freeze a row's set).

Not playtested (RULE #1c). Checked: `node --check` on every edited file, data.js through load-data.js, and a local
page load with the edited scripts served in place of the CDN copies (the game object builds, 696 spells; the only errors
were the sandbox failing to reach the three.js CDN).
