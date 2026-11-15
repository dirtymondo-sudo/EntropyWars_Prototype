---
name: traps-pack-20261027
description: Traps pack (PR #595) + Spike Trap spell (PR #600), 10-27 — mondo's Assets/traps GLBs: bear trap in Snare/Spring Snare, sarcophagus/coffin in mummy spells + Boot Hill, editor Traps group, undercroft dressing, calls flagged
metadata:
  type: project
  modified: 2026-10-27T07:09:27.282Z
---
PR #595 (2026-10-27), mondo: "added a traps folder, use the bear trap for the trap spell and there's a tomb and sarcophogus tht can be used for mummy or anubis spells. idk if there's a spike trap spell but there is that too". Looks only. Token 20261027-traps-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0709.zip.

- R2 Assets/traps: GLBs with NO texture + one sheet color_swatches_purple.png; three-renderer.js `_trapsMat` shared Lambert + 0.3 self-lift (dark rust went black in the undercroft). -colonly files unused. Kill-switch EW_NO_TRAPS_PACK.
- Spells: Spring Snare laid = open bear trap; Snare's owner sigil too; `fire('spring')` jaw snap (step trigger, _springTrap spike, thrown onto occupant). Embalm lid, Curse of the Tomb rising sarcophagus, Mummify upright case behind victim, Entombed finisher closes a sarcophagus, Boot Hill real coffin.
- Editor "Traps" group 28 tiles. Rooms: Merlin's undercroft cells (maidens, chains, bear trap, trip wire, plate + dart holes), Vatican catacombs open coffin.
- SPIKE TRAP (PR #600, 10-27, mondo: "add a spike trap spell, like rocky spikes from pokemon"): `raceSpikeTrap` Earth tier II, 50 MP, 1 AP, anomaly/earth, range 3, placeTrap trapType 'spike' (Snare's rule: dmg 40 WEAK + Root 2) at trapSize 2 (4 tiles, each springs once), 1 per caster. Pit_Trap_Spikes look (tips out for owner, burst on spring). Calls flagged. Token spiketrap-02, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0809.zip.
- ONLINE GOTCHA: 'spring' relay beats the state-sync moving the guest's unit, guest fog dropped every trap snap; fixed via `uid` + `_trapsOwnVictim`. Two-seat harness: two SEPARATE chromium launches (one browser + 2 tabs = screenshot hangs); script in scratch spk*.js pattern (route.js install, lobbyCreateRoom/lobbyJoinRoom, startMatch).
- GOTCHA: pack models are centred on length; standing a case upright needs lift = half length (`_trapsStandUp(S, lift)`).
- Editor cam: EWEditor.cam({x,y,z,yaw,pitch}) metres, forward = (sin yaw, -cos yaw). Proof shots /mnt/project-files/traps-pack/.
- Calls flagged to mondo: Snare also uses the bear trap; Mummify's upright case; room dressing; the self-lift.
Related [[ocean-pack-20261027]] [[horses-20261027]].
