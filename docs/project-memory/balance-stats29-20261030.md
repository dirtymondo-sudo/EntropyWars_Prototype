---
name: balance-stats29-20261030
description: 10-30 STATS29 read (STATS28 raises landed, cuts overshot, ~9 pts/100 POWER; one 48-game run ≈ 20-25% signal) + PR #693 28-race pass sized by shrinkage
metadata:
  type: project
  modified: 2026-10-30T01:52:18.818Z
---
mondo 10-30 01:40 sent ew-balance-stats29.json ("analyze and balance please"): 756 Arena, ~48 a race; builds stats28-01 248 /
chesspiece-04 405 / aitrain-01 103. All after PR #684 + #681 (Trick or Treat). Upload: /mnt/project-files/uploads/hearth/2e9b3406-df36-4ccf-8bf3-e1208eb126f3.
S24 export = 00dd038d; older 859aaf84-b201-431a-bdd3-3e4357a799a9.

Findings: PR #684 raised 12 went 38.6→51.2 (pred 44.4, landed), cut 16 went 61.7→46.8 (pred 57.8, overshot). Golem 68→38, Angel 63→36,
Tree Person 61→38: these three move ~15-20 pts/100 POWER. Overall ~9 pts/100 POWER (S28 said 5) → this pass used 7.
True race sd ≈ 4 pts (S28/S29 covariance τ² ≈ .0015-.0018); a single 48-game run is ~20-25% signal, 3 pooled runs ~65%.
The new AI (103 matches) kept the strong/weak split (58.5 vs 40.3).

SHIPPED PR #693 (merged, token 20261030-stats29-01-cors, zip ENTROPY_WARS_SYNC_20261030-0151 = data.js 731a9d9c). Rebake fit-on=6
(fit-on=5 put 3.1 on VISION); median 1008→918. Rule (flagged): pool every run since the race's last stat change; bar 90% pooled, 95% one run;
size = pooled gap × τ²/(τ²+noise), 100 POWER per 7 pts. Spells: Every Eye at Once 50→40/ray, Crystal Resonator 110→95, Piercing Arrow 110→95.
Stats 12 weak + 16 strong, HP + dmg stat only (M.ATK on magic pools: Firefighter 34→90, Bee Queen 86→140, Starfish 119→180).
Left alone: Ghost (card open, strongest at 63% pooled), Jack (Trick or Treat, 48%), Golem/Angel/TP (miss 95% bar, avoid 3rd swing).
mondo 02:00 was ANGRY at the skips: "dont skip them if they are weak ... dont skip strong races either ... if it seesawed then clearly you need to try something different". RULE: every race at ≤40% or ≥60% in the newest run gets a change, never skipped. PASS 2 PR #694 (token stats29-02, zip ENTROPY_WARS_SYNC_20261030-0201 = data.js b06834ba): 16 more races + Mech raise undone; Golem/Angel/TP +76 POWER sized on their own ~17 pts/100 swing. GHOST: mondo answered the card — Incorporeal stays immune to physical spells too (already the code); balance Ghost by stats (M.ATK 143→110, HP 590→460).
Watch: Golem/Angel/TP, Unicorn, Chess Piece (32 games), Mech. Not lab-checked. Related [[balance-stats28-20261029]] [[power-refit-20261029]].
