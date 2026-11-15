---
name: machine-elves-lattice-proposals-20261029
description: 10-29 Machine Elves playtest + mondo's picks (A1, all B, C1, C2) BUILT in PR #663, attack-a-prism fix PR #665; unpicked fixes still open
metadata:
  type: project
  modified: 2026-10-29T06:01:13.601Z
---

mondo 10-29 asked for a Machine Elves playtest + ideas. They are Terence McKenna DMT machine elves, not machinery. Proposals doc: https://claude.ai/artifact/Nk6NfxX9kxuRxtrmt9BkTs ; shots in /mnt/project-files/machine-elves-playtest/.

mondo picked "a1, all of b, and c1 and c2" -> built in PR #663 (merged 10-29, token 20261029-elves-01-cors, zip ENTROPY_WARS_SYNC_20261029-0601):
- A1 PRISM left-panel action (data.js RACE_INHERENT_SPELLS, spell marked `inherent`, hidden from ABILITIES; excluded from his pool; tree R1 now Visible Language). Crystal Guardian + Ice Queen keep Prism Mirror as a spell, NO button (mondo). CG gem spells = separate thread.
- B1 bank shots (own line spells turn at own prisms, door-laser rule, 3 turns, leftover reach; Pulse beams run past end prisms to the wall). B2 reflect (single damage/debuff at unit on beam/next to prism; once per prism per round; forecast REFLECTED). B3 prism hit fires back once per round. B4 Mirror Blink lands next to any own prism. Mechanics apply to ANY prism owner (CG/IQ too).
- C1 Tune 0 AP, not the turn's spell, frequency sub-menu (state._tunePick, online tuneTo), applies status/stage at once. C2 Infrared=fire, Ultraviolet=psychic, Gamma=lightning.

Still open (not picked): walk/burn ignore M ATK, own AoE breaks own prisms, range overlay shows fogged tiles, raised tiles unpickable, Pulse doesn't end turn, Pulse/Shatter forecast. Calls made by thread: inherent prism can't be Spellstolen; bank keeps leftover reach (not to the wall).

PROOF (10-29, coordinator asked): two-seat online room. B2 reflect proven (guest Djinn Weigh the Heart -> REFLECTED forecast + 208 back, host+guest). B3 needed a fix: enemy prisms were never in battle.js _getAttackValidTargets, so no basic attack could pick one; PR #665 lists them like a turret + hud row "🔺 Prism" (token 20261029-elves-02-cors, zip ENTROPY_WARS_SYNC_20261029-0642 = battle.js+hud.js). Then Skeleton hit prism -> fire-back 75 + Burning. Shots: /mnt/project-files/machine-elves-playtest/proof-reflect-bite/.
