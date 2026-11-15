---
name: online-pvp-playtest-guest-20261023
description: 10-23 two-thread online PvP playtest, guest side (Haunted House Arena 4v4): report link, top bugs, and the two-browser harness recipe.
metadata:
  type: project
  modified: 2026-10-23T04:22:46.850Z
---

10-23 mondo asked for two threads to play an online PvP match and report bugs/friction. This was the GUEST thread (a separate host thread wrote its own report; it played Camelot Arena). Friendly room, Arena 4v4, Haunted House Arena, 10 rounds. Host Homosapien/Bigfoot/Catgirl/Sedan vs guest Goatman/Symbiote/Ghost/Fortune Teller.
Report (report only, nothing fixed): https://claude.ai/artifact/9hTxTApvhkCPCSEBbnM6x7 ; page + shots in /mnt/project-files/online-pvp-guest/.

Top findings:
- G1 guest turns have NO shot clock: host REMOTE turn handoff calls _stopShotClock() (battle.js ~53867) and nothing restarts it, so the host backstop (_shotClockExpired, ~75535) never fires. A Fortune Teller turn sat open 33 min.
- G2 guest socket drop on the LOAD screen kills the match for both: server.js ~409 gives the host 20 s to snapshot; a host still loading can't. "The match could not be restored."
- G3 Attack CONFIRM row names a tile ("Dark Grass H10") not the highlighted enemy; pressing it did nothing.
- G4 friendly room starts at 15 rounds (online.js:3106), Arena's 20 only after clicking Arena.
- G6 the winning sudden-death kill (round 11) never reached the guest: guest end screen 4v4 standing vs host 3v4, guest Bigfoot 0 HP not dead. Guest WON (tied after R10).
- No desyncs and no fog leaks across ~200 actions; mid-match 7 s guest drop recovered (host WATCHDOG forced a turn advance meanwhile, unproven skip).

Harness: two separate chromium launches (one per seat) with SwiftShader, driven via a local HTTP control server; loopback only, so no real latency tested. See [[hands-on-playtest]] [[online-pvp-pass]] [[pvp-audit-20261021]].
