---
name: demo-set-proposal-20261110
description: 11-10/11 PvP demo item 5 SHIPPED PR #1098: Demo switch (16 starters + 16 unlocks, 9 arenas, data.js DEMO_RULES) + mondo's 12 rule answers (6 changed)
metadata:
  type: project
  modified: 2026-11-11T00:04:44.557Z
---
mondo 11-10 23:28Z approved the coordinator's six-item PvP demo list. Item 5 (thread in the owner project).
Doc: https://claude.ai/artifact/7spRzLZXkAH9yFKuZpcjCv (top section = what was decided and built).
SHIPPED PR #1098 (main f0805be, token 20261111-demoset-01-cors, data.js 835022a6 live on R2; 10 files uploaded).

mondo's words 11-10 23:47Z: quarterback instead of sidekick; arenas Training Room, Holo Sim, Looking Glass, Fairy Forest, Technoticlan,
Stonehenge, Flying Dutchman, Northpole, Hell; rules 1B 2A 3A 4A 5A 6C 7B 8B 9A 10B 11B 12A; "expand the demo roster to 32, or at
least maybe everyone can start off with the same 16 and can unlock up to 32 or 36 ish". Rule 8 number: his card pick "Dodge at the 25% cap".

THE DEMO (data.js DEMO_RULES; notes docs/notes/ui-menus-audio.md "THE DEMO"): optional filter, OFF by default. Settings > Demo or ?demo=1/0
(localStorage ew_demo_mode); DEMO_RULES.on = shipped default (true also makes the server Quick Play pool follow).
- starters: knight, zombie, bigfoot, door agent, catgirl, shadow entity, robinhood, martian, djinn, mummy, angel, mermaid, grey, mothman, honda civic, quarterback.
- unlocks (MY pick, awaiting his look): general, nephilim, ki fighter, king kong, goatman, mantid, cosmic wraith, anubis, professor, starfish,
  dreameater, hippie, mushroom girl, ai, glitch, sidekick. Unlock = the existing Shop path (defeat one in a match, then 5,000 gold / free token); I did not invent another.
- Training Room + Holo Sim are 8x8 VS CPU boards; online rooms deal only 9-12 boards, so online plays the other seven. Offered: a 12x12 cut of each = separate job.
- Online: host's switch rides friendly-config `demo` -> guest NET._roomDemo; squad outside roster does not lock in; host guard refuses.

RULES CHANGED (docs/notes/champions-combat.md "THE SIX RULE ANSWERS"): 1 ally remains edible (notOwnGrave); 6 resolveTileArrival fires
checkOverwatchTriggers for every via but move/climb; 7 battle.js getCharmer (_charmSourceId): no attack/counter/overwatch/unit-cast at charmer;
8 EVASION_CAP for minimize; 10 feared cleared after an actual flee; 11 weathersOppose true for two different wet weathers.
UNCHANGED by his answer (settled, no longer open): 2 delayed blasts enemies only, 3 Guard restores twice, 4 throws may land on allies,
5 tackle pays bonus + slam, 9 Marked physical only, 12 R10 squares only.
BROWSER PROOF 11-11 (coordinator asked): all six changed rules played before/after in a headless match (old main 101f491 vs PR #1098), each confirmed in the combat log.
Sheets + RULE_PROOF_LOG.txt + probes (boot.js, rules.js, two.js): /mnt/project-files/demo-set-20261110/rule-proof/. Rule 8 has no on-screen readout of dodge chance (number read from getEvasionChance: 0.25).
TWO SEATS: only rule 7 confirmed (guest's charmed unit cannot hurt its charmer, other target hit; Charmed/Guarding/Feared sync). That gap FIXED PR #1105 (token 20261111-charmline-01-cors): board click on the charmer gives the Charm line (battle.js _outOfReachLine), and a guest's own refusal lines survive host snapshots (addLog o.mine + online.js _applyRemoteState lg/lgN); proven on two seats. Rule 6/10/11 two-seat NOT confirmed (guest spell order from the probe never ran on the host).
FOUR OVERTURNABLE PICKS listed to mondo (unanswered): rule 1 ally respawn +2 rounds; rule 7 scope (attack/counter/Overwatch/single-target cast barred, area casts free); rule 10 cornered unit stays Feared; rule 11 Blizzard counts as wet (+ natural roll never forms a second wet weather). Change nothing further without his word.
Probe gotchas: Playwright executablePath '/opt/pw-browsers/chromium'; one browser at a time (two halves the speed); spells need the caster in sight of the target even with fog off; statuses can be resisted (re-roll applyStatusEffects); one spell per turn; two pages loading at once can overflow the Playwright pipe and close the browser at ~15 s (load the host, wait 30 s, then the guest); two-seat windows are so slow the 60 s shot clock ends guest turns (hold state.shotClock.startedAt in the probe); the guest may only order its blitz-active unit.
Related [[balance-loop-20261108]].
