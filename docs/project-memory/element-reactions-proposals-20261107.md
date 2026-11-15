---
name: element-reactions-proposals-20261107
description: 11-07 proposal doc R1-R17 for new status/element/terrain/weather reactions (nothing built; mondo picks)
metadata:
  type: project
  modified: 2026-11-07T05:10:33.426Z
---

mondo 11-07 05:02 asked for "more reactions almost like chemistry, as long as it makes sense and is consistent" (like Wet making
lightning hit harder). Thread "Propose new status, element, terrain and weather reactions" (thread in the owner project).
Doc: /mnt/project-files/proposals/ELEMENT_REACTIONS_PROPOSALS_20261107.md (current-reaction matrix + 17 proposals + dropped list).

R1 dry weather dries Wet (reads close to a bug: Drought dries squares, not units); R2 Solar Flare thaws/melts/dries; R3 Drought feeds fire;
R4 Burn+Poison=Corroded (ask: water douses Corroded?); R5 Gooed bodies catch fire (mirror of WET CONDUCTS); R6 fire cauterises Bleeding;
R7 fire on poison bog = Corroded; R8 water washes Goo; R9 water ends Overclock; R10 Thunderstorm bolt conducts (high risk);
R11 sonic shatters ice/crystal/Frozen; R12 Earthquake cracks ice/crystal; R13 earth smothers fire, lava->stone; R14 nature regrows scorched;
R15 wind spells fan ground fire; R16 Bleeding drips blood (vs 10-21 "only Blood Rain makes blood" default); R17 fire on water = steam Blind (weakest).
Dropped: water spreads oil fire, blood conducts/freezes, sandstorm blind, light/dark, metal/psychic.

Code facts checked: storm strikes (state.js stormStrikeUnit) ride the combo layer but never call triggerTerrainSpellReaction;
no code clears bleed/goo/overclock/poison/root by element. Related [[playtest-elements-20261106]] [[playtest-status-effects-20261107]] [[weathers-together-20261029]].

11-07 05:32 mondo: build all except R17 steam. Coordinator split: this thread R1-R7, sibling threads R8-R12 and R13-R16.
R1-R7 SHIPPED PR #984 (main 37bfffe, token 20261107-react17-01-cors, uploaded battle/state/map/data). Water puts out Corroded -> Poison (his 'sounds good'). Notes champions-combat.md "THE NEW REACTIONS R1-R7". Proof /mnt/project-files/element-reactions-20261107/r1-r7/.
