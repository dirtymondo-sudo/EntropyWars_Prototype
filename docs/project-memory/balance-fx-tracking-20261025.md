---
name: balance-fx-tracking-20261025
description: 10-25 Balance Lab stats20 analysis (proposals doc) + new Status/Elements/Effects telemetry tabs in the lab
metadata:
  type: project
  modified: 2026-10-25T10:20:43.476Z
---
mondo 10-25 sent ew-balance-stats20.json (840 Arena matches, 120 races) and asked for balance ideas + tracking of
status / effect / element usage.

Built PR #521 (merged 10-25, battle.js, token 20261025-balfx-02-cors, zip ENTROPY_WARS_SYNC_20261025-1039.zip): `_balanceStats.statusUse / elementUse / effectUse` + `fxMatches`, same
IndexedDB key ew-balance-stats-v4 (old matches kept, new tables start empty). Per-match ledger `_balFx` by unit id,
folded in recordBalanceMatch (`_balFoldFxMatch`). Hooks: applyStatusPayload (applied/resisted/blocked), the
end-of-round tick loop (DoT dmg/kills), applyDamageToUnit (`_balRecordHit`: element, crit, type weak/resist, status
combo, Marked, reaction, zodiac surge, element terrain, high ground; dmg while debuffed/buffed; kills), heals, shield
soak, press, resolveForcedSlide. Tabs Status / Elements / Effects; JSON export analysis.statuses/elements/effects; CSV.

Proposals doc (nothing applied, mondo picks): https://claude.ai/artifact/QZYZLqzhSuLXZwprdMQyfs
Top: Juggernaut 75, Ghoul/KK/Nephilim 72, Mech 70. Bottom: Mime 25, Eagleman 27, MIB 32, Mummy 32, Astronaut 33.
HP correlates 0.52 with WR (physical HP1300+ 57% vs casters <900 HP 44%). Spell picks offered: Things That Go Bump 3->2
targets, Whole House Shakes 4->3 hits, Eternal Slumber T4 stun (flagged vs tier rule), Tremor Stomp -20%, Miasma -15%;
buffs for multi-hit T4s (Ninefold Scratch, Six-Shooter, Excessive Machine), Giant Smash, Rampage, Railgun, Tether Line,
Infernal Conscription. 95 fielded spells never cast = AI work. Symbiote overshot to 63% after PR #471.
Related [[win-condition-balance]] [[weak-races-lab-20261023]] [[strong-races-check-20261023]].

DOT BUG FIXED in PR #521 (flagged to mondo): processEndOfRoundStatuses' no-visuals path (_skipVisuals: sims, Balance
Lab, animations off) skipped every onRoundEnd, so burn/poison/bleed/regen never ticked there. Every lab export before
10-25 under-reads DoT kits; re-run the lab before trimming DoT spells.
Screenshots /mnt/project-files/balance-fx/. Headless harness: /mnt/project-files/balance/weak-races-harness/fxlab.js (copy of weak-races
harness lab.js, chromium-1243 path, seeds IndexedDB from an export). 3 workers crashed one tab; 2 is safe.

PR #524 (merged 10-25, token 20261025-deadslots-01-cors, zip ENTROPY_WARS_SYNC_20261025-1252.zip = ai.js + data.js): the
recommended spell nerfs/buffs shipped (Eternal Slumber's AoE stun dropped, flagged). CPU dead-slot fixes in ai.js v4.19
(status-only casts scored 0; _setupFirst; _friendlyStatusValue; warCry Fermata branch; landing-tile danger for
blinks/escapes). Lab after: 42 of 818 fielded spells never cast (was 95). Teleports still near-dead (target finder
only blinks when hurt+adjacent or beyond walk reach). STAT TESTS (lab only, not applied, ~28 games/arm, noise ±18):
only Mech HP 1544->1350 showed a signal (79%->50%). Harness lab3.js (--alt per-match arms) + diag.js in the harness
folder; 3 workers lose tabs to memory (~3.5 GB each), 2 is safe.
