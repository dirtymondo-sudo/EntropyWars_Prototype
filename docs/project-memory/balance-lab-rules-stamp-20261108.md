---
name: balance-lab-rules-stamp-20261108
description: 11-08 Balance Lab audit after the status/element fixes (PR #1045): rules stamp moved old fx tables to fxBefore, new status uptime + reaction columns, options offered to mondo
metadata:
  type: project
  modified: 2026-11-08T01:44:00.295Z
---
mondo 11-08 01:17: "make sure the balance lab is still up to date and gives useful/relevant data. Anything else you would add?"
Thread (thread in the owner project). PR #1045 merged (main c351c63), token 20261108-ballab-01-cors,
uploaded battle.js 32ef0461 / state.js 279c6804 / ai.js b7fa4be4.

Finding: the lab runs the REAL engine, so every rule fix already applied; only the telemetry was stale.
Shipped: THE RULES STAMP (BAL_FX_RULES; Status/Elements/Effects tables from before move to stats.fxBefore on first load,
soaked folded into wet, nothing deleted); soaks from water/rain now count as Wet landings; status cols env/fresh/rounds/
turnsLost/cleansed (row "rd" = round ends still on per fresh landing, "t" = turns it took); every reaction counted as
effectUse react_* + analysis.reactions + analysis.reactionsNeverFired; ai.js status value 'soaked' -> 'wet' (v4.35).
Proof: /mnt/project-files/balance-lab-20261108/. Notes: champions-combat.md "THE LAB AFTER THE STATUS + ELEMENT FIXES".

02:04 mondo picked 1-3 -> PR #1046 (token 20261108-ballab-02-cors, battle.js b8915299): fxByBuild per build token + picker,
Races "cc" (turns sat out to Stun/Frozen), Combos tab (pay-offs by teammate/self/board; per race setups/finishes).
Still offered, NOT picked: win rate by weather / map; first-mover advantage; "compare with last export" view. Related [[balance-fx-tracking-20261025]] [[playtest-status-effects-20261107]].
