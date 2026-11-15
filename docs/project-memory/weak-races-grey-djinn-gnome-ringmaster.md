---
name: weak-races-grey-djinn-gnome-ringmaster
description: 10-23 weak-race check of Grey, Djinn, Gnome, Ringmaster (mondo's three picks shipped in PR #448)
metadata:
  type: project
  modified: 2026-10-23T08:18:39.317Z
---

2026-10-23 thread "Weak races check: Grey, Djinn, Gnome, Ringmaster" Report first, then mondo picked "those 3 things at the end" -> PR #448 (merged 10-23): CPU scores summons by life damage, traps/mines by likely hit, near-certain setups at statusSetupSure 0.6 (untrained), no CC credit vs passive-immune; Ankle Biter 110 + Garden Shears 170 anomaly, Scrap Mine 140 (goblin too), Tissue Sample range 4; Grey SPD 60, Djinn HP 480. Lab after: team WR 4.7% -> 13.9% (280 games); Elephant cast 78x (was 1). Missing Time still ~never cast (its only payoff is Grey's own Tissue Sample after the 1-round stun ends). NOT applied: Crack the Whip 150, Grey HP 650, Gnome ATK 80, Ringmaster SPD/MP.

- Hand match (Stonehenge 10x10, 4v4 vs CPU): lost 319-465 with kills tied 7-7 and more damage dealt; lost on Nexus (24 vs 40 rounds) and Cube (0 vs 733). The team moves 1/3/2/2 tiles and cannot contest objectives.
- Lab: one-per-team WR Grey 37.5%, Djinn 47.3%, Gnome 47.9%, Ringmaster 43.1%. All four on one team: 4 of 86 (4.7%).
- Root causes: Grey SPD 48 (one under the 2-tile line) + HP/DEF F; Djinn HP 324 (3rd lowest); Gnome signature attacks are human-type physical on ATK 39 (4th-8th percentile dmg/cast); Ringmaster's summons almost never cast.
- CPU almost never casts summons (flat 150 score), traps (45 + 30/enemy), Lamp Smoke, Missing Time, Lawn Ornament: they lose to damage spells in ai.js scoring since only one spell per turn. A fix there helps every utility-heavy race.
- Proposed (spells first): Tissue Sample range 2->4; Ankle Biter 80->110 + Garden Shears 130->170 both anomaly; Scrap Mine 100->140; Crack the Whip 125->150. Stats: Grey SPD 60 HP 650, Djinn HP 480, Gnome ATK 80, Ringmaster SPD 90 MP 230.
- Report page: https://claude.ai/artifact/P159GAtjGKrTGzquEvyVgA . Test buffs, all four on one team: spells 12.9% (62 games), stats 17.5% (177), baseline 4.7%.
- Headless lab harness (balance/weak-races-harness in project files) works with --mods for spell/stat test buffs; screenshots in weak-races-grey-djinn-gnome-ringmaster/.

**Why:** mondo asked for this check and picked the three fixes.
**How to apply:** if mondo picks buffs, apply only those named; "balance spells before race stats". Related: [[win-condition-balance]] [[playtest-cube]]
