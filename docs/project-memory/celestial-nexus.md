---
name: celestial-nexus
description: Factions are removed; celestial events give a per-unit buff to the team that claims the middle nexus (PRs #252, #256, 2026-10-17)
metadata:
  type: project
  modified: 2026-10-17T12:20:21.273Z
---
PR #252 (2026-10-17, mondo): factions are gone from the whole game (data, synergy, UI, race editor). A new celestial event resets the MIDDLE nexus to nobody.
PR #256 rev 2: events last 3 rounds. PR #258: fixed timer, start rounds 4, 9, 14, 19 (the 15% roll often gave none in a match), never the same type twice in a row. Capturing the middle during an event CLAIMS the buff: unit.skyBuff = event key on every living unit of that team (ui.js claimCelestialBuff), cleared from everyone first. It lasts until the unit dies (or respawns/revives) or the next claim, even after the event ends. Blood Moon +10% ATK & M ATK; Lunar Eclipse +10% DEF & M DEF; Black Sun +15% healing +5% extra HP & MP regen per round. Only Arena has a middle nexus. Event visuals belong to a separate thread ("Realistic celestial event looks").
PR #267 (nexus rules pass): one CAPTURED float; enemy zone counts NEUTRALIZE n/4 then CAPTURE n/4 (ui.js nexusTeamReadout); step-on tick runs at the end of doMove (after ice slide/warp), so only the tile you END on counts. PR #268 (mondo's answers): ONE BAR, every zone reads as a count to 8 from your side (enemy 0/8, neutral 4/8, yours 8/8; internal progress stays -4..+4). Stepping off a zone not fully yours takes 1 point back (_nexusOnUnitLeave); a held zone stays 8/8. Step-ins count when contested; a move starting inside the same zone doesn't tick; jumping in ticks.
**Why:** mondo said factions weren't consequential, and wanted time to capture plus a lasting reward.
**How to apply:** don't reintroduce faction fields; sky buff logic goes through state.js getSkyEventBonus (reads unit.skyBuff).
