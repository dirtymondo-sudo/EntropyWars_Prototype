---
name: ai-training-20261101
description: 11-01 AI training run on main with jump (PR #723): 952 SPSA matches, h2h 51.1% ±3.1 = NOT baked; gap list (Keys never found, traps never cast) + training ideas
metadata:
  type: project
  modified: 2026-11-01T07:08:16.349Z
---
11-01 mondo: "any other gaps in the ai, or ways to improve the ai training? run a training session for a few hundred games and if it gets better, bake it in". Thread "Train the CPU AI and find remaining gaps". Report doc: https://claude.ai/artifact/8cCDN2X8HypbonWd6S3TQ9

RESULT: trained on main incl. CPU jump (ai.js 5ca12ffa, v4.25): 952 Arena matches / 476 pairs, 60 min, 3 workers (~16/min). Fresh h2h trained vs shipped defaults: 369-353 / 722, graded 51.1% ±3.1 (360 pairs) = inside noise -> NOT baked, no PR, no zip. Weights near optimum for current code; gains now come from code (jump 59%, combos 52.7%).

GAPS found (h2h spell counter, 72k decisions): (1) KEYS never found: 68 matches, 4 of 340 Keys held at buzzer, 94% of checks no side had seen a Key; Inspect 1.5% of decisions; both sides 0.0 Keys at end. Biggest lead (35 pts/Key). (2) Traps (Snare/Spike/Trapdoor/Deathtrap) castable 1,637, scored 929, cast 0. (3) Escapes/swaps rarely: Tag In 0/1,050, Temporal Shift 0/599, Grapple 2/3,719. (4) Inner Peace scorer ignores its +1 M.DEF (0 scored/280); weather/terrain/hazard flat numbers. (5) From the Ceiling 0/159 (no high-ground setup). (6) Teleport-any only sends away. (7) finisher before setup mate. (8) threat read ignores enemy Sprint/Teleport/Jump + LOS. (9) Hard = Normal x1.3 objectives.
Training ideas: make #721-723 hard-coded constants trainable; sparring styles in Training; train TDM/Clash; decaying SPSA steps + averaging; auto-gate saved thetas.

Files: /mnt/project-files/ai-training/run-20261101/ (harness/duel_usage.js = duel.js + per-spell castable/scored/cast counter via instr.py _aiProbe hook; keyprobe.js; theta_trained_NOT_BAKED.json). Gotcha: `pgrep -f "duel.js ..."` / `pkill -f` match your own shell line; use ps -eo.

[[ai-training-rework-20261029]] [[ai-audit-20261101]] [[status-combos-ai-20261101]]

KEYS SHIPPED (11-01, PR #735, zip r2-sync/ENTROPY_WARS_SYNC_20261101-0830.zip, ai.js dedc78ae, stamp v4.27 …+traps+keys, token 20261101-keys-01-cors): _keyWorth (35 pts × arenaPointValue + Key Charge + Keys-win step), _inspectFirst for every unit, walk to a seen dropped Key, carrier death costs its Keys. Two Keys on one square already worked (Inspect takes every loose Key on the square). Lab: Inspects 2.8→4.4/side/match, found 0.16→0.29, seen Key picked 4%→22% (rest lose to hits scored ~800 vs ~300). H2H vs main 264-258 / 522 (50.6% ±3.6). Kill switch EW_AI_NO_KEY_SENSE. Notes champions-combat.md "THE KEYS". mondo 11-01: remaining fixes go to fresh threads in batches of 1-3 (coordinator starts them).
