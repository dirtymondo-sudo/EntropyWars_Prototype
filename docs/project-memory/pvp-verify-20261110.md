---
name: pvp-verify-20261110
description: 11-10/11 two-seat re-check of online fixes #1072-#1075 + traps/CLASH/eor camera; reload fixes PR #1102; HOST RELOAD KEEPS MATCH PR #1104; checklist doc for mondo's real match
metadata:
  type: project
  modified: 2026-11-11T01:08:15.494Z
---

Thread "Verify online fixes in a real two-player match" (PvP demo prep item 1). PR #1102 merged + live 2026-11-11, online.js sha 23a2ae98, token 20261111-reloadroom-01-cors.

Verified fine, 2 Chromium seats: guest To the Moon landing pick + own throw line in fog; host Infernal Hurl; Fire for Effect mark + blast; Scrap Mine, Tesla Coil,
hidden Snare (absent from guest state until sprung); CLASH in sync; result-screen drop then rematch; rematch keeps 5 rounds; closed tab = VICTORY at 90 s from either seat.

Fixed in PR #1102 (online.js only): reloaded guest came back on the old block board without the site room (now warms the arena before applying the snapshot,
`_recoveryArenaWait`); reloaded HOST sent title-screen state and both seats hung (now both get "The host page lost its active match" in ~20 s);
rematch after a reload waited on the party builder (squad kept in sessionStorage ew_rejoinSquad, starts in 8 s); stale room chip; guest camera on weather callouts (eor-focus rounding).

HOST RESTORE BUILT 11-11 (coordinator asked, mondo has not said yes or no) PR #1104, online.js b47f7c65, token 20261111-hostrestore-02-cors:
host saves its own match to sessionStorage ew_hostSave on quiet boards (`_hostSaveWrite`), a host page booting into a rejoin lays it back (`_hostRestoreBegin`).
Proven 2 seats: 5 host reloads (own turn, guest turn, round 5, mid-walk), play on, result, rematch, guest reload after. Back in 30-40 s.
KNOWN LIMIT, told to mondo: a reload mid-action undoes that action for both (a host could take back its own action). No save = the old notice.
Not checked: CLASH/simul restore. Live tier achievement popup can show again on a reloaded page (display only).
Minor, left alone: the notice is a plain unstyled bar; guest log omits an enemy's move line when it walks out of fog. Not checked on real WebGPU / real network.

Checklist doc for mondo + friend (12 steps, ?ewdiag=1 COPY REPORT): https://claude.ai/artifact/6bXTZhwfEYXAS5g69gWTuc . Waiting on his reports.
Proof: /mnt/project-files/pvp-verify-20261110/. Notes: docs/notes/champions-combat.md "THE RELOAD, TWO SEATS".

Harness tips: party builder picks by ROSTER tab + slot coordinates, names need the gender suffix ("Demon ♂"); compare logs through `_logVisible` (host log is unfiltered);
raise the shot clock by console for slow sandbox turns.
Related [[pvp-playtest-20261109]] [[own-action-log-actor-20261109]] [[online-fog]]
