---
name: type-spread-proposal-20261027
description: 10-27 race type spread: 14 races retyped per mondo's picks, SHIPPED PR #603 (Human 57->49, Alien 15->20); no new characters
metadata:
  type: project
  modified: 2026-10-27T08:10:00.052Z
---
mondo 10-27: "game is dominated by human and anomaly type characters", asked for retypes or new characters. Proposal only, NO code.
Page: https://claude.ai/artifact/CEWMYMgVnu8kRr8R1swS1S (ticks recount spread + spell pressure live, "Copy my picks" button).

Count (RACE_PROFILES.types, 131 AVAILABLE_RACES, duals count twice): Human 57, Anomaly 50, Unholy 32, Divine 19, Tech 16, Alien 15.
Tech spells hit 45 races x1.30, Unholy 45; Alien spells resisted by 51.

Pre-ticked (no STAB lost or STAB gained): Mad Scientist->tech, Priest->divine, Nun->divine, Black Goo->unholy/alien,
Symbiote->unholy/alien, Professor->tech, Barbarella->human/tech, Annunaki->alien/divine, Occulus->alien/divine, Watcher->divine/alien.
Unticked options: Zombie/Mummy->unholy, Ghost->anomaly/unholy, Mech->tech, MIB->tech/alien, Reptilian->alien (cost STAB, lab first).
New chars (existing families only, need a model from mondo): Tank, Computer Virus, Satellite, Flying Saucer, Xeno Stalker, Star Child, Cherub, Sphinx.

Build notes: type lives in data.js RACE_PROFILES[race].types; types[0] picks COMBO_REGISTRY duo combo, cinematic colour,
story customs line, finisher fallback. FINISHERS rows carry own `type` tag (Black Goo/Professor/Barbarella/Occulus/Reptilian = anomaly) to update.
Retype touches matchups (spells, basic attacks, Entropy Strike), STAB, press refund. Related [[balance-stats23-20261026]].

SHIPPED PR #603 (merged 10-27, token 20261027-typespread-01-cors, zip ENTROPY_WARS_SYNC_20261027-0820.zip = data.js ff50f1df).
mondo's final: Mad Scientist tech/unholy, MIB tech/anomaly, Reptilian alien, Professor + Mech UNCHANGED, Zombie/Mummy unholy, Ghost anomaly/unholy,
rest as pre-ticked. New characters: none. Finisher tags moved: Reptilian alien, Barbarella tech, Black Goo unholy, Occulus alien. Tape 2 Nun/Zombie line fixed.
